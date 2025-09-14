import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResume, fetchUserProgress } from "../utils/api";

const ProgressDashboard = ({ progress: initialProgress = [], parsedResume: initialParsedResume = null }) => {
  const [parsedResume, setParsedResume] = useState(initialParsedResume);
  const [progress, setProgress] = useState(initialProgress);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) return;

    getResume(token)
      .then((resume) => setParsedResume(resume))
      .catch((err) => console.error("Error fetching resume:", err));

    fetchUserProgress(username)
      .then((progressData) => setProgress(progressData))
      .catch((err) => console.error("Error fetching progress:", err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Candidate Dashboard</h2>

      {parsedResume && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Uploaded Resume</h3>
          <pre
            style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}
            className="whitespace-pre-wrap max-h-64 overflow-auto border border-gray-200"
          >
            {parsedResume.raw_text}
          </pre>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4">Progress</h3>
      {progress.length === 0 ? (
        <p className="text-gray-600">No tests/interviews completed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 border-collapse">
            <thead className="bg-indigo-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Score/Feedback</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                  <td className="border border-gray-300 px-4 py-2">{p.type}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {p.completed ? (
                      <span className="text-green-600 font-semibold">Completed</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{p.feedback || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {p.id ? (
                      <button
                        onClick={() => navigate(`/tests/${p.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded"
                      >
                        View Questions
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
