import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      const { token, username } = res.data;

      // Save JWT in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);

      navigate("/dashboard");
      window.location.reload(); // ✅ Force full page reload to update UI
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div
      style={{ maxWidth: "400px", margin: "50px auto" }}
      className="bg-white shadow-lg rounded-xl p-8 border border-gray-200"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          style={{ width: "100%", padding: "8px" }}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-200"
        >
          Login
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
      <p className="text-sm text-center mt-4 text-gray-600">
        Don't have an account?{" "}
        <a href="/signup" className="text-indigo-600 hover:underline">
          Signup
        </a>
      </p>
    </div>
  );
};

export default Login;
