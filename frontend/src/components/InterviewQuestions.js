import React, { useState } from "react";
import {
  generateQuestions,
  followUpQuestions,
  generateFeedback,
} from "../utils/api";
import Proctoring from "./Proctoring"; // import proctoring component

const InterviewQuestions = ({ parsedResume, role, onInterviewComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [proctoringStarted, setProctoringStarted] = useState(false);
  const [violationMessage, setViolationMessage] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateQuestions(parsedResume, role);
      setQuestions(res.questions || []);
      setCurrentIndex(0);
      setAnswers([]);
      setFeedback("");
      setViolationMessage(null);
      setProctoringStarted(true);
      setTerminated(false);
    } catch (err) {
      console.error(err);
      alert("Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleViolation = (message) => {
    setViolationMessage(message);
    setTerminated(true);
    alert(`Interview Terminated Due to Proctoring Violation: ${message}`);

    onInterviewComplete?.({
      type: "Interview Terminated",
      reason: message,
      questions,
      answers,
    });
  };

  const handleNext = async () => {
    if (terminated) return;
    if (!currentAnswer) return alert("Enter your answer.");

    const updatedAnswers = [...answers, currentAnswer];

    if (currentIndex + 1 < questions.length) {
      setAnswers(updatedAnswers);
      setCurrentAnswer("");
      setCurrentIndex(currentIndex + 1);

      if (updatedAnswers.length === 1) {
        try {
          const res = await followUpQuestions(currentAnswer, role);
          setQuestions((prev) => [...prev, ...res.questions]);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setGeneratingFeedback(true);
      setAnswers(updatedAnswers);
      try {
        const res = await generateFeedback(
          role,
          "interview",
          questions,
          updatedAnswers
        );
        setFeedback(res.feedback || "");
        onInterviewComplete &&
          onInterviewComplete({
            type: "Interview",
            questions,
            answers: updatedAnswers,
            feedback: res.feedback,
          });
        setCurrentAnswer("");
      } catch (err) {
        console.error(err);
      } finally {
        setGeneratingFeedback(false);
      }
    }
  };

  return (
    <div>
      {/* Instructions */}
      {!proctoringStarted && questions.length === 0 && (
        <div className="mb-6 p-4 border border-gray-300 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold text-indigo-600 mb-2">
            🗣️ Interview Instructions
          </h2>
          <ul className="list-disc pl-5 text-base text-gray-700 space-y-1">
            <li>This interview simulates real-time question/answer rounds.</li>
            <li>Proctoring is enabled to monitor for violations.</li>
            <li>Answer each question thoughtfully before proceeding.</li>
            <li>Follow-up questions may appear based on your response.</li>
            <li>Do not turn off or move away from the camera.</li>
            <li>Do not switch tabs or close the application while the interview is going on.</li>
            <li>Violations will result in automatic interview termination.</li>
          </ul>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`mt-4 px-4 py-2 rounded-md font-semibold transition ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Generating..." : "Start Interview"}
          </button>
        </div>
      )}

      {/* Proctoring */}
      {proctoringStarted && !terminated && (
        <Proctoring onViolation={handleViolation} />
      )}

      {/* Violation Message */}
      {violationMessage && (
        <div className="my-4 p-2 bg-red-100 text-red-700 rounded-md font-semibold">
          Violation Detected: {violationMessage}
        </div>
      )}

      {/* Interview Questions */}
      {!terminated &&
        questions.length > 0 &&
        currentIndex < questions.length && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">
              Question {currentIndex + 1}
            </h3>
            <p className="mb-4">{questions[currentIndex]}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleNext}
              disabled={generatingFeedback}
              className={`mt-3 px-4 py-2 rounded-md font-semibold transition text-white ${
                generatingFeedback
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {currentIndex + 1 === questions.length
                ? generatingFeedback
                  ? "Finishing..."
                  : "Finish Test"
                : "Submit Answer"}
            </button>
          </div>
        )}

      {/* Feedback */}
      {!terminated && feedback && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">
            Interview Feedback
          </h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "8px",
            }}
            className="max-h-64 overflow-auto border border-gray-200 font-mono text-sm"
          >
            {feedback}
          </pre>
        </div>
      )}

      {/* Terminated */}
      {terminated && (
        <div className="mt-10 p-4 bg-red-50 border border-red-300 text-red-700 rounded-md text-center">
          <h2 className="text-xl font-bold mb-2">Interview Terminated</h2>
          <p>{violationMessage}</p>
          <p className="mt-2 text-sm">
            Please contact support or try again later.
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewQuestions;
