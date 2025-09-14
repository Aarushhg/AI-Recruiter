import React, { useState, useEffect } from "react";
import { generateAptitude, generateFeedback } from "../utils/api";

const AptitudeTest = ({ role, onTestComplete }) => {
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("Random");
  const [questions, setQuestions] = useState(""); // raw text
  const [parsedQuestions, setParsedQuestions] = useState([]); // parsed questions array
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min = 1800 sec
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleAutoSubmit();
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateAptitude(level, topic); // Pass topic to API
      let raw = res.questions || "";

      raw = raw
        .replace(/Okay,.*?questions:/i, "")
        .replace(/^1\.\s*Here are \d+.*questions:/im, "")
        .trim();

      const parsed = raw
        .split(/Q:/)
        .filter((q) => q.trim() !== "")
        .map((q) => {
          const lines = q.trim().split("\n").filter((l) => l.trim() !== "");
          const questionText = lines[0].trim();
          const options = lines.slice(1, 5).map((opt) => opt.replace(/^[A-D]\)\s*/, ""));
          return { question: questionText, options };
        })
        .filter((q) => !/^here are \d+/i.test(q.question));

      setQuestions(raw);
      setParsedQuestions(parsed);
      setSubmitted(false);
      setFeedback("");
      setAnswers({});
      setStarted(true); // disable button
      setTimeLeft(1800); // reset timer
      setTimerActive(true); // start timer
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Updated: single-choice answer selection
  const toggleAnswer = (qIdx, optIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [qIdx]: [optIdx], // overwrite with single selected option
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setTimerActive(false); // stop timer
    try {
      const userAnswers = parsedQuestions.map((q, idx) => answers[idx] || []); // collect user answers
      const res = await generateFeedback(
        role,
        "aptitude", // test type is always "aptitude"
        parsedQuestions.map((q) => q.question),
        userAnswers
      );

      setFeedback(res.feedback || "");
      onTestComplete &&
        onTestComplete({
          questions: parsedQuestions,
          answers: userAnswers,
          feedback: res.feedback,
          score: res.score || 0, // add score to feedback
          total: res.total || 25, // total score
        });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSubmit = () => {
    if (!submitted) {
      handleSubmit();
    }
  };

  return (
    <div className="flex justify-between">
      {/* Left Side: Test */}
      <div className="flex-1">
        {/* 📝 Instructions and Controls */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2 text-indigo-600">📝 Aptitude Test Instructions</h2>
          <ul className="list-disc pl-5 text-base text-gray-700 mb-4">
            <li>The test consists of <strong>25</strong> multiple-choice questions from your chosen topic and difficulty.</li>
            <li>You will have <strong>30 minutes</strong> to complete the test.</li>
            <li>Select the <strong>correct option</strong> for each question. Only one option can be selected.</li>
            <li>Once submitted, you will receive feedback and a score based on your responses.</li>
            <li>If time runs out, your test will be automatically submitted.</li>
          </ul>

          <div className="flex gap-4 items-center">
            <label className="font-medium">
              Difficulty:
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="font-medium">
              Topic:
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              >
                <option value="Random">Random</option>
                <option value="Algebra">Algebra</option>
                <option value="Geometry">Geometry</option>
                <option value="English">English</option>
                <option value="Physics">Physics</option>
                <option value="Probability">Probability</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
              </select>
            </label>

            <button
              onClick={handleGenerate}
              disabled={loading || started}
              className={`px-4 py-2 rounded font-semibold transition-colors duration-200
              ${loading || started ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            >
              {started ? "Test Started" : "Generate Questions"}
            </button>
          </div>
        </div>

        {/* Questions Display */}
        {parsedQuestions.length > 0 && (
          <div>
            {parsedQuestions.map((q, idx) => (
              <div key={idx} className="mb-4">
                <p className="mb-1 font-semibold">
                  {idx + 1}. {q.question}
                </p>
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="block cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`question-${idx}`}
                      checked={(answers[idx] || [])[0] === oIdx}
                      disabled={submitted}
                      onChange={() => toggleAnswer(idx, oIdx)}
                      className="mr-2"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            {!submitted && (
              <button
                onClick={handleSubmit}
                className="mt-4 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
              >
                Submit Test
              </button>
            )}
          </div>
        )}

        {/* Feedback Display */}
        {submitted && feedback && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Feedback</h3>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded font-mono text-sm">
              {feedback}
            </pre>
          </div>
        )}
      </div>

      {/* Right Side: Timer */}
      {timerActive && !submitted && (
        <div className="ml-8 text-2xl font-bold self-start select-none">
          ⏳ {formatTime(timeLeft)}
        </div>
      )}
    </div>
  );
};

export default AptitudeTest;
