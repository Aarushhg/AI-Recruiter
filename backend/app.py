from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import re
import os
import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta
import bcrypt
import jwt
from functools import wraps
from bson import ObjectId
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# -------------------- MongoDB Setup --------------------
MONGO_URI = os.getenv("MONGO_URI")  # e.g., mongodb://localhost:27017/AI_Interviewer
client = MongoClient(MONGO_URI)
db = client.get_database()  # Uses AI_Interviewer
users_col = db["users"]
tests_col = db["tests"]
resumes_col = db["resumes"]
progress_col = db["progress"]
chat_col = db["chat_history"]

try:
    client.admin.command('ping')
    print("✅ MongoDB is connected successfully!")
except Exception as e:
    print("❌ Failed to connect to MongoDB:", e)

# -------------------- JWT Setup --------------------
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_SECONDS = 3600  # 1 hour

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            try:
                token = request.headers["Authorization"].split(" ")[1]
            except:
                pass
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = users_col.find_one({"_id": ObjectId(payload["user_id"])})
        except Exception as e:
            return jsonify({"error": "Token is invalid"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# -------------------- Authentication Routes --------------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_col.insert_one({
        "username": username,
        "email": email,
        "password": hashed_pw,
        "created_at": datetime.now()
    })
    return jsonify({"message": "User registered successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    payload = {
        "user_id": str(user["_id"]),
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return jsonify({"token": token, "username": user["username"], "email": user["email"]})

# -------------------- Gemini & Piston Setup --------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
PISTON_URL = "https://emkc.org/api/v2/piston/execute"

# ---------- Skill Dictionary ----------
TECH_SKILLS = {
    "python", "javascript", "java", "c", "c++", "c#", "html", "css",
    "react.js", "node.js", "express", "express.js",
    "sql", "mysql", "postgresql", "mongodb", "aws", "docker",
    "kubernetes", "flask", "django", "typescript", "next.js",
    "git", "github", "api", "machine learning", "data science",
    "analytics", "tensorflow", "pytorch", "nlp", "data analytics"
}

# --------- Helpers ----------
def normalize_skill(word: str) -> str:
    return word.strip().lower()

def extract_skills(text):
    text_lower = text.lower()
    found_skills = set()
    for word in re.findall(r'\b[\w+#.]+\b', text_lower):
        norm = normalize_skill(word)
        for skill in TECH_SKILLS:
            if norm == skill.lower():
                found_skills.add(skill)
    multi_word_skills = ["machine learning", "data science", "data analytics", "node.js", "react.js", "c++"]
    for skill in multi_word_skills:
        if skill.lower() in text_lower:
            found_skills.add(skill)
    return sorted(found_skills)

def pdf_to_text(file):
    pdf_reader = PyPDF2.PdfReader(file)
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_resume_data(text):
    skills = extract_skills(text)
    education = []
    edu_matches = re.findall(r'(\d{4})\s+([A-Za-z0-9 &.-]+(?:University|School|College))', text)
    for year, institute in edu_matches:
        education.append(f"{year} {institute.strip()}")
    experience = []
    exp_matches = re.findall(r'([A-Za-z0-9 &.-]+)\s*\|?\s*(\d{1,2}\s+\w+,\s+\d{4}\s*-\s*\d{1,2}\s+\w+,\s*\d{4})', text)
    for company, duration in exp_matches:
        experience.append(f"{company.strip()} ({duration.strip()})")
    projects = []
    proj_matches = re.findall(r'(?:PROJECTS|Project Name|Key Projects)[:|-]?\s*(.*?)\s*(?:Key Skills|$)',
                              text, flags=re.IGNORECASE | re.DOTALL)
    for match in proj_matches:
        for p in re.split(r'\n|\|', match):
            p_clean = p.strip()
            if p_clean:
                projects.append(p_clean)
    return {
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "raw_text": text
    }

def call_gemini(prompt):
    headers = {"Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY}
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    res = requests.post(GEMINI_URL, headers=headers, json=body)
    res.raise_for_status()
    data = res.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]

# -------------------- Resume & Interview Routes --------------------
@app.route("/parse-resume", methods=["POST"])
@token_required
def parse_resume(current_user):
    file = request.files.get("resume")
    if not file:
        return jsonify({"error": "No resume file provided"}), 400
    text = pdf_to_text(file)
    parsed = extract_resume_data(text)
    return jsonify(parsed)

@app.route("/save-resume", methods=["POST"])
@token_required
def save_resume(current_user):
    data = request.json
    resume_text = data.get("resume")

    if not resume_text:
        return jsonify({"error": "Resume text is required"}), 400

    # Insert resume into 'resumes' collection
    resume_doc = {
        "user_id": current_user["_id"],  # Store user ID for reference
        "resume": resume_text
    }

    resumes_col.insert_one(resume_doc)

    return jsonify({"message": "Resume saved successfully"})

@app.route("/get-resume", methods=["GET"])
@token_required
def get_resume(current_user):
    try:
        user_id = current_user["_id"]
        print("Current user:", current_user)
        print("Looking for resumes with user_id:", user_id)

        resume_doc = resumes_col.find_one(
            {"user_id": user_id},
            sort=[("_id", -1)]
        )

        if not resume_doc:
            return jsonify({"resume": ""}), 200

        resume_json = resume_doc["resume"]
        print("Found resume:", resume_json)

        # Safely decode if it's a JSON string
        if isinstance(resume_json, str):
            resume_data = json.loads(resume_json)
        else:
            resume_data = resume_json

        return jsonify({"resume": resume_data}), 200

    except Exception as e:
        print("Error in /get-resume:", str(e))
        return jsonify({"error": "Server error", "details": str(e)}), 500


@app.route("/generate-questions", methods=["POST"])
@token_required
def generate_questions(current_user):
    data = request.json
    parsed = data.get("parsed", {})
    role = data.get("role", "")
    skills = ", ".join(parsed.get("skills", [])) or "general programming"
    experience = "\n".join(parsed.get("experience", [])[:5]) or "general experience"
    education = "\n".join(parsed.get("education", [])[:3]) or "general education"

    prompt = f"""
You are an expert interviewer.
The candidate is applying for: {role}.

Candidate background:
- Skills: {skills}
- Experience: {experience}
- Education: {education}

Task:
Generate 15–20 interview questions (excluding 'Tell me about yourself').
- Minimum 10 technical referencing candidate's skills/experience.
- Minimum 5 behavioral questions.
Do not include any intro text.
"""
    try:
        output_text = call_gemini(prompt)
        questions = [re.sub(r"^\d+[\).:-]?\s*", "", line.strip())
                     for line in output_text.split("\n") if line.strip()]
        while len(questions) < 15:
            questions.append("Tell me about a project where you applied your skills. What challenges did you face?")
        if len(questions) > 20:
            questions = questions[:20]
        questions = ["Tell me about yourself."] + questions

        # Save generated questions to user tests
        tests_col.insert_one({
            "user_id": current_user["_id"],
            "role": role,
            "test_type": "interview",
            "questions": questions,
            "timestamp": datetime.now()
        })

        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"questions": [], "error": str(e)})

# -------------------- Follow-up Route --------------------
@app.route("/follow-up", methods=["POST"])
@token_required
def follow_up(current_user):
    data = request.json or {}
    answer = data.get("answer", "").strip()
    role = data.get("role", "").strip()

    if not answer or not role:
        return jsonify({"error": "Both 'answer' and 'role' are required"}), 400

    prompt = f"""
You are an interviewer for the role: {role}.
The candidate just said: "{answer}"

Task:
Generate 2–3 concise, role-relevant follow-up interview questions.
"""

    try:
        output_text = call_gemini(prompt)
        questions = [re.sub(r"^\d+[\).:-]?\s*", "", line.strip())
                     for line in output_text.split("\n") if line.strip()]

        # Ensure at least 2 questions
        while len(questions) < 2:
            questions.append("Can you elaborate more on that?")

        # Limit to 3 questions max
        questions = questions[:3]

        # Find latest interview test document for this user and role
        interview_doc = tests_col.find_one(
            {"user_id": current_user["_id"], "role": role, "test_type": "interview"},
            sort=[("timestamp", -1)]
        )

        if not interview_doc:
            # No interview document found, insert new one with questions
            tests_col.insert_one({
                "user_id": current_user["_id"],
                "role": role,
                "test_type": "interview",
                "questions": questions,
                "timestamp": datetime.now()
            })
        else:
            # Append follow-up questions to existing questions
            updated_questions = interview_doc.get("questions", []) + questions
            tests_col.update_one(
                {"_id": interview_doc["_id"]},
                {"$set": {"questions": updated_questions, "timestamp": datetime.now()}}
            )

        return jsonify({"questions": questions})

    except Exception as e:
        return jsonify({"questions": [], "error": f"Failed to generate follow-up questions: {str(e)}"}), 500


# -------------------- Aptitude --------------------
@app.route("/generate-aptitude", methods=["POST"])
@token_required
def generate_aptitude(current_user):
    data = request.json
    level = data.get("level", "easy")
    topic = data.get("topic", "Random")  # new topic field

    # Construct a more explicit prompt
    prompt = f"""
You are an expert aptitude test generator.
Generate exactly 25 multiple-choice questions (MCQs) of {level} difficulty.

The questions should be strictly about the topic: "{topic}".

Format each question like this:
Q: <question text>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
Answer: <correct option>

Do NOT include any explanation or introduction text.
Separate each question clearly with a line "---".
"""

    try:
        output_text = call_gemini(prompt)

        # Store in database under user's progress
        tests_col.insert_one({
            "user_id": current_user["_id"],
            "test_type": "aptitude",
            "level": level,
            "topic": topic,
            "questions": output_text,
            "timestamp": datetime.now()
        })

        return jsonify({"questions": output_text})
    except Exception as e:
        return jsonify({"questions": [], "error": str(e)})

# -------------------- Coding --------------------
@app.route("/generate-coding", methods=["POST"])
@token_required
def generate_coding(current_user):
    data = request.json
    level = data.get("level", "easy")
    topic = data.get("topic", "Random")  # added topic support

    # Construct prompt dynamically
    prompt = f"""
Generate exactly 2 coding problems of {level} difficulty
focused on the topic: {topic}.
Include:
1. Problem statement
2. Input format
3. Output format
4. Sample input and output
Do NOT include solutions.
"""

    try:
        output_text = call_gemini(prompt)

        # Store in database for the current user
        tests_col.insert_one({
            "user_id": current_user["_id"],
            "test_type": "coding-problems",
            "level": level,
            "topic": topic,
            "questions": output_text,
            "timestamp": datetime.now()
        })

        return jsonify({"questions": output_text})
    except Exception as e:
        return jsonify({"questions": [], "error": str(e)})

# -------------------- Feedback --------------------
@app.route("/generate-feedback", methods=["POST"])
@token_required
def generate_feedback(current_user):
    data = request.json
    test_type = data.get("test_type", "general")
    questions = data.get("questions", [])
    answers = data.get("answers", [])
    role = data.get("role", "")

    # Save raw answers per user
    # Try to find the existing interview doc to update
    existing_test = tests_col.find_one({
        "user_id": current_user["_id"],
        "role": role,
        "test_type": "interview"
    })

    if existing_test:
        # Update the existing document with answers
        tests_col.update_one(
            {"_id": existing_test["_id"]},
            {"$set": {
                "answers": answers,
                "timestamp": datetime.now()
            }}
        )
    else:
        # Fallback: insert if no existing interview doc found
        tests_col.insert_one({
            "user_id": current_user["_id"],
            "role": role,
            "test_type": "interview",
            "questions": questions,
            "answers": answers,
            "timestamp": datetime.now()
        })

    # Construct the question-answer pairs for the AI
    qa_pairs = "\n".join([f"Q: {q}\nA: {a}" for q, a in zip(questions, answers)])

    if test_type == "aptitude":
        # For aptitude tests, ask the AI to calculate the score
        prompt = f"""
        You are an expert evaluator for an aptitude test.
        The candidate has completed an aptitude test for the role: {role}.
        
        Responses:
        {qa_pairs}
        
        Task:
        - Calculate the score out of 25 based on the candidate's answers.
        - Provide feedback on strengths and areas for improvement.
        - Suggest improvements for incorrect answers.
        Provide your answer in the format: "Score: <score> / 25"
        """
    elif test_type == "coding":
        # For coding tests, evaluate whether the code is correct
        prompt = f"""
        You are an expert evaluator for a coding test.
        The candidate has completed a coding test for the role: {role}.
        
        Responses:
        {qa_pairs}
        
        Task:
        - Based on the answers and the code provided, evaluate if the code is correct.
        - The code should be considered 'accepted' if it passes all the test cases.
        - If the code fails any test cases, it should be considered 'rejected'.
        Provide your answer in the format: "Result: <accepted/rejected>"
        """
    elif test_type == "interview":
        # New logic for interview feedback
        prompt = f"""
        You are an expert interviewer evaluating a candidate's interview answers.
        The candidate has completed an interview for the role: {role}.

        Responses:
        {qa_pairs}

        Task:
        - Provide detailed, constructive feedback on the candidate's answers.
        - Highlight strengths and areas for improvement.
        - Suggest actionable advice to improve performance in future interviews.
        """

    else:
        return jsonify({"error": "Invalid test type"}), 400

    try:
        # Call Gemini with the constructed prompt
        output_text = call_gemini(prompt)

        # For aptitude tests, extract score and feedback from the response
        if test_type == "aptitude":
            score_match = re.search(r"Score: (\d+)", output_text)
            score = int(score_match.group(1)) if score_match else 0
            return jsonify({"score": score, "total": 25, "feedback": output_text})

        # For coding tests, check if the AI returned 'accepted' or 'rejected'
        if test_type == "coding":
            result_match = re.search(r"Result: (accepted|rejected)", output_text.lower())
            result = result_match.group(1) if result_match else "rejected"
            return jsonify({"result": result, "feedback": output_text})

        # For interview, just return the feedback text
        if test_type == "interview":
            return jsonify({"feedback": output_text})

    except Exception as e:
        return jsonify({"feedback": "", "error": str(e)})


# -------------------- Code Execution --------------------
@app.route("/run-code", methods=["POST"])
@token_required
def run_code(current_user):
    data = request.json
    language = data.get("language", "python")
    code = data.get("code", "")
    stdin = data.get("input", "")
    payload = {"language": language, "source": code, "stdin": stdin}
    try:
        res = requests.post(PISTON_URL, json=payload)
        res.raise_for_status()
        result = res.json()
        return jsonify({
            "stdout": result.get("output", ""),
            "stderr": result.get("stderr", ""),
            "time": result.get("time", "")
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/submit-code", methods=["POST"])
@token_required
def submit_code(current_user):
    data = request.json
    language = data.get("language", "python")
    code = data.get("code", "")
    test_cases = data.get("test_cases", [])
    results = []
    for case in test_cases:
        payload = {"language": language, "source": code, "stdin": case.get("input", "")}
        try:
            res = requests.post(PISTON_URL, json=payload)
            res.raise_for_status()
            output = res.json().get("output", "").strip()
            expected = case.get("output", "").strip()
            passed = output == expected
            results.append({"input": case.get("input"), "expected": expected, "output": output, "passed": passed})
        except Exception as e:
            results.append({"input": case.get("input"), "error": str(e), "passed": False})
    score = sum(r["passed"] for r in results)
    # Save per user
    tests_col.insert_one({
        "user_id": current_user["_id"],
        "language": language,
        "code": code,
        "results": results,
        "score": score,
        "total": len(test_cases),
        "test_type": "coding",
        "timestamp": datetime.now()
    })
    return jsonify({"results": results, "score": score, "total": len(test_cases)})

# -------------------- Chatbot --------------------
@app.route("/api/chat", methods=["POST"])
@token_required
def chatbot(current_user):
    data = request.json
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "Message is required"}), 400
    try:
        reply = call_gemini(user_message)
        chat_col.insert_one({
            "user_id": current_user["_id"],
            "user_message": user_message,
            "bot_reply": reply,
            "timestamp": datetime.now()
        })
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)})

# -------------------- Protected Example Route --------------------
@app.route("/protected", methods=["GET"])
@token_required
def protected_route(current_user):
    return jsonify({"message": f"Hello {current_user['username']}! You are authorized."})

# -------------------- User Progress Route --------------------
@app.route("/api/progress/<username>", methods=["GET"])
@token_required
def get_user_progress(current_user, username):
    if current_user["username"] != username:
        return jsonify({"error": "Unauthorized access"}), 403

    user_id = current_user["_id"]

    # Fetch all tests for the user, sorted by timestamp descending
    tests = list(tests_col.find({"user_id": user_id}).sort("timestamp", -1))

    progress_list = []
    for test in tests:
        feedback = f"Topic: {test.get('topic', 'N/A')}, Level: {test.get('level', 'N/A')}"

        progress_list.append({
            "id": str(test["_id"]),
            "type": test.get("test_type", "unknown"),
            "completed": True,
            "feedback": feedback
        })

    return jsonify(progress_list)

@app.route("/api/test-questions/<test_id>", methods=["GET"])
@token_required
def get_test_questions(current_user, test_id):
    # Step 1: Validate ObjectId
    try:
        test_obj_id = ObjectId(test_id)
    except Exception as e:
        return jsonify({"error": "Invalid test ID"}), 400

    # Step 2: Query the database
    test_doc = tests_col.find_one({
        "_id": test_obj_id,
        "user_id": current_user["_id"]
    })

    if not test_doc:
        return jsonify({"error": "Test not found"}), 404

    # Step 3: Extract questions
    questions = test_doc.get("questions", [])

    # Step 4: Return response
    return jsonify({"questions": questions})


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500
 
# -------------------- Run Flask --------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
