import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const isLoggedIn = !!localStorage.getItem("token"); // returns true if token exists

  return (
    <div className="flex items-center justify-around bg-gray-800 text-white p-4 mb-8">
      <Link
        to="/"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        Home
      </Link>
      <Link
        to="/dashboard"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        Dashboard
      </Link>
      <Link
        to="/aptitude-test"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        Aptitude Test
      </Link>
      <Link
        to="/coding-test"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        Coding Test
      </Link>
      <Link
        to="/interview"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        Interview
      </Link>
      <Link
        to="/chatbot"
        className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
      >
        AI Assistant
      </Link>

      {!isLoggedIn && (
        <Link
          to="/login"
          className="font-bold px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200"
        >
          Login
        </Link>
      )}
    </div>
  );
};

export default Header;
