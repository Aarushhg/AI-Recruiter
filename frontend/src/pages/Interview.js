import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import InterviewQuestions from "../components/InterviewQuestions";
import { getResume } from "../utils/api";

const Interview = ({ parsedResume: initialParsedResume, role, onInterviewComplete }) => {
  const navigate = useNavigate();
  const [parsedResume, setParsedResume] = useState(initialParsedResume);
  const [loading, setLoading] = useState(!initialParsedResume);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!parsedResume) {
      setLoading(true);
      getResume(token)
        .then((resume) => {
          if (!resume || Object.keys(resume).length === 0) {
            setError("No resume found. Please upload your resume first.");
          } else {
            setParsedResume(resume);
          }
        })
        .catch(() => setError("Failed to load resume."))
        .finally(() => setLoading(false));
    }
  }, [navigate, parsedResume]);

  // Keep your original return structure without removing anything
  return (
    <div
      style={{ padding: "2rem" }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center"
    >
      {loading ? (
        <div>Loading resume...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 border border-gray-200">
          <InterviewQuestions
            parsedResume={parsedResume}
            role={role}
            onInterviewComplete={onInterviewComplete}
          />
        </div>
      )}
    </div>
  );
};

export default Interview;
