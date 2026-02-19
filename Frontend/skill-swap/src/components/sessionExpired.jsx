import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import nigesh from "../audio/nigesh.mp3";

const SessionExpired = ({ reason }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (reason === "invalid") {
      const audio = new Audio(nigesh);
      audio.play().catch(err => console.error("Audio play blocked:", err));
    }
  }, [reason]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-700 flex items-center justify-center px-4">
      <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn">

        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {reason === "expired" ? "Session Expired" : "Invalid Session"}
        </h2>

        <p className="text-gray-600 mb-6">
          {reason === "expired"
            ? "Your login session has expired. Please log in again to continue."
            : "Your token is invalid. Please log in again."}
        </p>

        <button
          onClick={() => {
            const audio = new Audio(nigesh);
            audio.play();
            audio.onended = () => {
            navigate("/");
         };
    }}
          className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow hover:bg-teal-700 transition-all duration-200"
        >
          Go to Login
        </button>

      </div>
    </div>
  );
};

export default SessionExpired;
