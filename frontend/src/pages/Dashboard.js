import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProgressDashboard from "../components/ProgressDashboard";

const Dashboard = ({ progress, parsedResume }) => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProtected = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // redirect to login if no token
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/protected", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage(res.data.message);
      } catch (err) {
        navigate("/login");
      }
    };
    fetchProtected();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/"; // redirect to home page after logout
  };

  return (
    <div className="max-w-5xl mx-auto p-8 mt-10 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h2>
      <p className="text-gray-600 mb-6">{message}</p>

      {/* Progress Dashboard */}
      <ProgressDashboard progress={progress} parsedResume={parsedResume} />

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-6 px-5 py-2 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 transition duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
