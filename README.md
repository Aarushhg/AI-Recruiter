# 🤖 HireBot – AI Interviewer Platform

HireBot is an AI-powered interview preparation and evaluation platform that helps candidates practice interviews and tests in a realistic environment. It integrates **resume parsing, AI-driven question generation, aptitude tests, coding challenges, progress tracking, and online proctoring** — all in one platform.

---

## 🚀 Features
- 📄 Upload & parse resumes to extract skills, education, and projects  
- 🤖 AI-generated technical & HR interview questions based on resume and role  
- 🧠 Aptitude & coding tests with instant evaluation  
- 📊 Progress dashboard to track performance  
- 💬 Chatbot-style interview with follow-up questions  
- 🔒 Secure authentication with JWT  
- 🕵️ Online proctoring for test integrity  
- ☁️ MongoDB database integration  

---

## ⚙️ Tech Stack
**Frontend:** React.js, Axios, JWT Auth, Tailwind/CSS  
**Backend:** Flask (Python), PyPDF2, JWT, MongoDB, Gemini API, Piston API  

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/hirebot.git
cd hirebot

Backend Setup:
cd backend
pip install -r requirements.txt


Create a .env file in backend/:

MONGO_URI=mongodb://localhost:27017/AI_Interviewer
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key


Run backend:

python app.py

3️⃣ Frontend Setup
cd frontend
npm install
npm start


Frontend: http://localhost:3000
Backend: http://localhost:5000

