import React, { useState, useEffect } from "react";
import SessionExpired from "./sessionExpired";

const ProtectedRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState({ checked: false, reason: null });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/verify", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 200) {
          setAuthStatus({ checked: true, reason: null }); // authenticated
        } else if (res.status === 401) {
          const data = await res.json();
          // Set reason to "expired" or "invalid"
          setAuthStatus({ checked: true, reason: data.type || "invalid" });
        } else {
          // fallback for other errors
          setAuthStatus({ checked: true, reason: "invalid" });
        }
      } catch (err) {
        console.error("Error verifying authentication:", err);
        setAuthStatus({ checked: true, reason: "invalid" });
      }
    };

    checkAuth();
  }, []);

  if (!authStatus.checked) {
    // you can render a loading spinner if needed
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Checking authentication...</p>
      </div>
    );
  }

  if (authStatus.reason) {
    return <SessionExpired reason={authStatus.reason} />;
  }

  return children;
};

export default ProtectedRoute;
