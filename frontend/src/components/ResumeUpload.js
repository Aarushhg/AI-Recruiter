import React, { useState, useEffect } from "react";
import { uploadResume, saveResume, getResume } from "../utils/api";
import { useNavigate } from 'react-router-dom';  // Change from useHistory to useNavigate

const ResumeUpload = ({ setParsedResume }) => {
  const [file, setFile] = useState(null);
  const [parsedResume, setParsedResumeState] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();  // Initialize navigate for redirection

  // Fetch saved resume on mount
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await getResume(token);
        if (res.resume) {
          setParsedResumeState(res.resume);
        }
      } catch (err) { 
        console.error("Error fetching saved resume:", err);
      }
    };
    fetchResume();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle upload & parse
  const handleUpload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload a resume!");
      navigate("/login");  // Redirect to login page using navigate
      return;
    }

    if (!file) {
      alert("Please select a resume PDF first");
      return;
    }

    setLoading(true);
    try {
      const parsed = await uploadResume(file, token); // calls /parse-resume
      setParsedResumeState(parsed);
      setParsedResume(parsed); // To propagate to the parent component

      // Save to backend resumes collection
      await saveResume(parsed, token); // calls /save-resume
      alert("Resume uploaded and saved successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-upload bg-white shadow-lg rounded-2xl p-6 max-w-xl mx-auto mt-8">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">Upload Resume</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="border border-indigo-200 rounded-lg p-2 mb-4 w-full"
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-3 mt-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-indigo-600 text-white'} hover:bg-indigo-700`}
      >
        {loading ? "Uploading..." : "Upload Resume"}
      </button>

      {/* Remove the resume preview display */}
      {/* 
      {parsedResume && (
        <div className="resume-preview mt-6 p-4 bg-gray-50 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-indigo-600 mb-3">
            Extracted Resume Data
          </h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(parsedResume, null, 2)}
          </pre>
        </div>
      )}
      */}
    </div>
  );
};

export default ResumeUpload;
