import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Please log in.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Error from backend:", data.error);
        return;
      }

      console.log("Bot reply:", data.reply);
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      console.error("Error:", err);
    }

    setInput("");
  };

  // Send on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{ padding: "1rem" }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4"
    >
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg p-6 border border-gray-200 flex flex-col">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          AI Chatbot
        </h2>

        {/* Chat Window */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-inner h-[500px] scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg text-sm max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <b className="block mb-1">{msg.role === "user" ? "You" : "Bot"}</b>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendMessage}
            className="px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
