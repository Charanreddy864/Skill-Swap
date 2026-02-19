import React, { useState, useEffect } from "react";
import Login from "./login";
import Signup from './signup';
import './loginAndSignup.css'

function LoginAndSignup() {
  const [isLogin, setIsLogin] = useState(false);
  return (
    <div className="login-and-signup bg-black h-screen w-2/5 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-black opacity-60"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '3s'}}></div>
      
      <div className="relative z-10 w-2/3 max-w-md">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-purple-900 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex w-full bg-black bg-opacity-50 backdrop-blur-sm">
            <button
              className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 relative overflow-hidden group ${
                !isLogin ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setIsLogin(false)}
            >
              <span className="relative z-10">Sign Up</span>
              {!isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              )}
              <div className={`absolute inset-0 bg-blue-900 transition-opacity duration-300 ${
                !isLogin ? "opacity-20" : "opacity-0 group-hover:opacity-10"
              }`}></div>
            </button>
            <button
              className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 relative overflow-hidden group ${
                isLogin ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => setIsLogin(true)}
            >
              <span className="relative z-10">Login</span>
              {isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              )}
              <div className={`absolute inset-0 bg-blue-900 transition-opacity duration-300 ${
                isLogin ? "opacity-20" : "opacity-0 group-hover:opacity-10"
              }`}></div>
            </button>
          </div>
          
          {/* Card Container with 3D Flip */}
          <div className="w-full flex items-center justify-center perspective p-8 min-h-[550px]">
            <div className={`card-container w-full ${isLogin ? "rotate" : ""}`}>
              <div className="card front">
                <Signup />
              </div>
              <div className="card back">
                <Login />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default LoginAndSignup;
