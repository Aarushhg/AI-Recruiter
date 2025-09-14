import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import CodingTest from "../components/CodingTest";

const CodingTestPage = ({ role, onTestComplete }) => {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour = 3600 sec
  const [timerActive, setTimerActive] = useState(false); // ✅ new
  const navigate = useNavigate();
      useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
        }
      }, [navigate]);

  useEffect(() => {
    if (!timerActive || timeLeft === 0) return;

    if (timeLeft === 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAutoSubmit = () => {
    onTestComplete({
      type: "Coding Test",
      completed: true,
      autoSubmitted: true,
    });
  };

  return (
    <div style={{ padding: "2rem" }}>

      {timerActive && (
        <p>
          ⏳ Time Left: <b>{formatTime(timeLeft)}</b>
        </p>
      )}

      <CodingTest
        role={role}
        onTestComplete={onTestComplete}
        onQuestionsGenerated={() => setTimerActive(true)} // ✅ start timer after questions load
      />
    </div>
  );
};

export default CodingTestPage;
