import React, { useState } from "react";
import { followUpQuestions } from "../utils/api";

const FollowUpQuestions = ({ answer, role }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await followUpQuestions(answer, role);
      setQuestions(res.questions || []);
    } catch (err) {
      console.error(err);
      alert("Failed to generate follow-up questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`px-4 py-2 rounded font-medium transition-colors duration-200
          ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
      >
        {loading ? "Generating..." : "Generate Follow-Up Questions"}
      </button>

      {questions.length > 0 && (
        <ul className="mt-4 list-disc list-inside space-y-2 text-gray-700">
          {questions.map((q, idx) => (
            <li key={idx}>{q}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowUpQuestions;
