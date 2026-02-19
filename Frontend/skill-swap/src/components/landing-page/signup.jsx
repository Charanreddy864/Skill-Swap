import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup(){
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate =useNavigate();
    
    const handleSignUp = async (userName, email, password) => {
      const inputErrors = {};
      if(!userName.trim())
      {
        inputErrors.userName = "User Name is required";
      }
      if(!email.trim())
      {
         inputErrors.email = "Email is required";
      }
      if(!password.trim())
      {
         inputErrors.password = "Password is required";
      }
      if(password && password.length < 6)
      {
          inputErrors.password = "Password must be at least 6 characters";
      }
      setError(inputErrors);
      if(Object.keys(inputErrors).length === 0) {
        try{
          const response = await fetch("http://localhost:8000/users/register",{
            method:"POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({userName,email,password}),
            credentials: "include"
          });
          const data = await response.json();

          if(response.ok) {
            navigate("/account-setup")
          }
          else
          {
            if(data.message.toLowerCase().includes("username")){
              setError({
                ...inputErrors,
                userName: data.message,
              });
            }
            else{
              setError({
                ...inputErrors,
                email: data.message,
              });
            } 
          }
        }
        catch(error) {
          console.error("Error during signup:", error);
          setError({ server: "An error occurred during signup. Please try again." });
        }

      }

    }
        return(
        <div className="signup-form relative">
            <div className="relative w-full mb-6">
              <input
                type="text"
                id="user-name"
                name="user-name"
                placeholder=" "
                onChange={(e)=> setUserName(e.target.value)}
                required
                className="peer w-full bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg px-4 pt-6 pb-2 text-base text-cyan-100 placeholder-transparent focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
              />
              <label
                htmlFor="user-name"
                className="absolute left-4 top-2 text-gray-400 text-xs transition-all duration-200 ease-in-out 
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
           peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400"
              >
                User Name
              </label>
              {error && error.userName && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error.userName}
                </p>
              )}
            </div>
            <div className="relative w-full mb-6">
              <input
                type="text"
                id="email"
                name="email"
                placeholder=" "
                onChange={(e)=> setEmail(e.target.value)}
                required
                className="peer w-full bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg px-4 pt-6 pb-2 text-base text-cyan-100 placeholder-transparent focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-gray-400 text-xs transition-all duration-200 ease-in-out 
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
           peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400"
              >
                Email
              </label>
              {error && error.email && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error.email}
                </p>
              )}
            </div>
            <div className="relative w-full mb-6">
              <input
                type="password"
                id="password"
                name="password"
                placeholder=" "
                onChange={(e)=> setPassword(e.target.value)}
                required
                className="peer w-full bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg px-4 pt-6 pb-2 text-base text-cyan-100 placeholder-transparent focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-gray-400 text-xs transition-all duration-200 ease-in-out 
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
           peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple-400"
              >
                Password
              </label>
              {error && error.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error.password}
                </p>
              )}
            </div>
            <button
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-semibold py-3 px-4 rounded-lg text-white w-full transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 mb-4"
              onClick={() => {handleSignUp(userName, email, password)}}
            >
              Sign Up
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 bg-opacity-50 text-gray-400">or</span>
              </div>
            </div>

            <button className="bg-gray-900 bg-opacity-50 hover:bg-opacity-70 border border-gray-700 hover:border-gray-600 text-gray-300 py-3 px-4 w-full rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
          
    )
}

export default Signup