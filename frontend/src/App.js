import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import CodingTestPage from "./pages/CodingTestPage";
import AptitudeTestPage from "./pages/AptitudeTestPage";
import Header from "./components/Header";
import Chatbot from "./pages/Chatbot";
import Login from "./pages/Login";   // updated path to pages
import Signup from "./pages/Signup"; // updated path to pages
import TestQuestionsPage from "./components/TestQuestionsPage";

const App = () => {
  const [parsedResume, setParsedResume] = useState(null);
  const [progress, setProgress] = useState([]);
  const [role, setRole] = useState("Software Developer");

  const handleTestComplete = (result) => {
    setProgress((prev) => [
      ...prev,
      { ...result, type: result.type || "Unknown", completed: true },
    ]);
  };

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home setParsedResume={setParsedResume} />} />
        <Route
          path="/dashboard"
          element={<Dashboard progress={progress} parsedResume={parsedResume} />}
        />
        <Route path="/tests/:testId" element={<TestQuestionsPage />} />
        <Route
          path="/interview"
          element={
            <Interview
              parsedResume={parsedResume}
              role={role}
              onInterviewComplete={handleTestComplete}
            />
          }
        />
        <Route
          path="/coding-test"
          element={
            <CodingTestPage role={role} onTestComplete={handleTestComplete} />
          }
        />
        <Route
          path="/aptitude-test"
          element={
            <AptitudeTestPage role={role} onTestComplete={handleTestComplete} />
          }
        />
        {/* ✅ Added Chatbot Route */}
        <Route path="/chatbot" element={<Chatbot />} />
        {/* ✅ Added Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;

