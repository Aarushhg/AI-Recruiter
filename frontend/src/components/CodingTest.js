import React, { useState, useEffect } from "react";
import { generateCoding, generateFeedback } from "../utils/api";

const CodingTest = ({ role, onTestComplete }) => {
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("Random");
  const [problems, setProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateCoding(level, topic);
      const raw = res.questions || "";

      const firstProblemIndex = raw.search(/Problem \d+:/i);
      const problemsText =
        firstProblemIndex >= 0 ? raw.slice(firstProblemIndex) : raw;

      const parsed = problemsText
        .split(/Problem \d+:/)
        .filter((p) => p.trim() !== "")
        .map((p, idx) => ({ title: `Problem ${idx + 1}`, text: p.trim() }));

      setProblems(parsed);
      setCurrentIndex(0);
      setCode("");
      setOutput("");
      setResults([]);
      setSubmitted(false);
      setFeedback("");
      setTimeLeft(3600);
      setTimerActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const fb = await generateFeedback(role, "coding", [problems[currentIndex].text], [
        { code, language },
      ]);
      setOutput(fb.feedback || "No feedback received.");
    } catch (err) {
      console.error(err);
      setOutput("Error analyzing code");
    } finally {
      setLoading(false);
    }
  };

  const handleNextOrSubmit = async () => {
    setResults((prev) => {
      const newResults = [...prev];
      newResults[currentIndex] = { code, language };
      return newResults;
    });

    if (currentIndex < problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCode("");
      setOutput("");
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setTimerActive(false);
    try {
      const fb = await generateFeedback(
        role,
        "coding",
        problems.map((p) => p.text),
        results
      );
      setFeedback(fb.feedback || "");
      onTestComplete &&
        onTestComplete({ problems, results, feedback: fb.feedback });
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
        {/* Instructions and Controls */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2 text-indigo-600">
            💻 Coding Test Instructions
          </h2>
          <ul className="list-disc pl-5 text-base text-gray-700 mb-4">
            <li>The test contains <strong>2</strong> coding problems based on your chosen topic and difficulty.</li>
            <li>You have <strong>1 hour</strong> to complete all problems.</li>
            <li>You can write and test your code using the provided editor.</li>
            <li>Click “Run Code” for AI analysis and suggestions (does not execute the code).</li>
            <li>Click “Next Problem” to move forward or “Submit Test” to finish.</li>
            <li>If time runs out, the test will be auto-submitted.</li>
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
                <option value="Basic">Basic</option>
                <option value="Patterns">Patterns</option>
                <option value="Arrays">Arrays</option>
                <option value="Linked List">Linked List</option>
                <option value="String">String</option>
                <option value="Trees">Trees</option>
                <option value="Graphs">Graphs</option>
                <option value="DP">DP</option>
              </select>
            </label>

            <button
              onClick={handleGenerate}
              disabled={loading || problems.length > 0}
              className={`px-4 py-2 rounded font-semibold transition-colors duration-200
              ${
                loading || problems.length > 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              Generate Coding Problems
            </button>
          </div>
        </div>

        {/* Coding Problems Section */}
        {problems.length > 0 && !submitted && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-indigo-600">
              {problems[currentIndex].title} ({currentIndex + 1}/{problems.length})
            </h3>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md mt-2">
              {problems[currentIndex].text}
            </pre>

            <label className="block mt-4 font-medium">
              Language:
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="c#">C#</option>
                <option value="typescript">Typescript</option>
              </select>
            </label>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here..."
              className="w-full h-36 mt-2 p-2 border border-gray-300 rounded-md font-mono text-sm"
            />

            <div className="mt-2 flex space-x-4">
              <button
                onClick={handleRun}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Run Code (AI Analysis)
              </button>
              <button
                onClick={handleNextOrSubmit}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
              >
                {currentIndex === problems.length - 1
                  ? "Submit Test"
                  : "Next Problem"}
              </button>
            </div>

            {output && (
              <pre className="bg-gray-200 p-4 rounded-md mt-2 whitespace-pre-wrap font-mono text-sm text-gray-900">
                {output}
              </pre>
            )}
          </div>
        )}

        {submitted && feedback && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-indigo-600">
              Final Feedback
            </h3>
            <pre className="whitespace-pre-wrap bg-gray-300 p-4 rounded-md font-mono text-sm">
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

export default CodingTest;
