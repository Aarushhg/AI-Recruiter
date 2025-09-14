import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTestQuestions } from "../utils/api";

const TestQuestionsPage = () => {
  const { testId } = useParams();
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStringSource, setIsStringSource] = useState(false); // track data type

  useEffect(() => {
    setQuestions(null);
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    getTestQuestions(testId)
      .then((data) => {
        if (!data || (typeof data !== "string" && !Array.isArray(data))) {
          setError("Invalid data format received.");
          setLoading(false);
          return;
        }

        let normalizedQuestions = [];

        if (Array.isArray(data)) {
          normalizedQuestions = data;
          setIsStringSource(false);
        } else if (typeof data === "string") {
          // Normalize string into question array
          normalizedQuestions = data
            .split(/\n|;/)
            .map((q) => q.trim())
            .filter((q) => q.length > 0);
          setIsStringSource(true);
        }

        setQuestions(normalizedQuestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load questions.");
        setLoading(false);
      });
  }, [testId]);

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!questions || questions.length === 0) return <p>No questions found.</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Test Questions</h2>

      {/* Use <ol> only for array-based (interview) questions */}
      {isStringSource ? (
        <div className="space-y-3 ml-2">
          {questions.map((q, idx) => (
            <p key={idx} className="whitespace-pre-wrap">
              {q}
            </p>
          ))}
        </div>
      ) : (
        <ol className="list-decimal ml-6">
          {questions.map((q, idx) => (
            <li key={idx} className="mb-3 whitespace-pre-wrap">
              {q}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default TestQuestionsPage;
    