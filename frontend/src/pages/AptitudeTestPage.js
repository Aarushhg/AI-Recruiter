import React, {useEffect} from "react";
import { useNavigate } from "react-router";
import AptitudeTest from "../components/AptitudeTest";

const AptitudeTestPage = ({ role, onTestComplete }) => {
  const navigate = useNavigate();
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
      }
    }, [navigate]);
  return (
    <div
      style={{ padding: "2rem" }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center"
    >
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <AptitudeTest role={role} onTestComplete={onTestComplete} />
      </div>
    </div>
  );
};

export default AptitudeTestPage;
