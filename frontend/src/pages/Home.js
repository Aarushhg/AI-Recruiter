import React, { useState } from "react";
import ResumeUpload from "../components/ResumeUpload";

const Home = ({ setParsedResume }) => {
  return (
    <div
      style={{ padding: "2rem", textAlign: "center" }}
      className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6"
    >
      <div className="max-w-2xl bg-white shadow-xl rounded-2xl p-10 border border-gray-200">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">
          Welcome to HireBot
        </h1>
        <div className="mb-8 max-w-xl mx-auto text-center">
          <p className="subtitle text-xl font-semibold text-indigo-600 mb-2">
            Your AI-powered placement trainer
          </p>
          <p className="text-lg text-gray-600">
            Upload your resume and take AI-generated interview, coding, and aptitude tests to evaluate your skills.
          </p>
        </div>

        <ResumeUpload setParsedResume={setParsedResume} />
      </div>
    </div>
  );
};

export default Home;
