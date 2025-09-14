import React, { useState } from "react";
import { generateFeedback } from "../utils/api";

const Feedback = ({ role, testType, questions, answers }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateFeedback(role, testType, questions, answers);
      setFeedbackText(res.feedback || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Feedback"}
      </button>
      {feedbackText && (
        <pre style={{ marginTop: "1rem", whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
          {feedbackText}
        </pre>
      )}
    </div>
  );
};

export default Feedback;
