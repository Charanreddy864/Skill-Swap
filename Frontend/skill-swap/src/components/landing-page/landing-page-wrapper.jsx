import React from "react";
import LoginAndSignup from "./loginAndSingup";
import Content from "./content";

function LandingPage() {
  return (
    <div className="landing-page bg-teal-600 h-screen flex">
      <Content />
      <LoginAndSignup />
    </div>
  );
}

export default LandingPage;
