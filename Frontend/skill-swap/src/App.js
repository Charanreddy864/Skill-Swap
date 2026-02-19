import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store/store";
import ProtectedRoutes from "./components/protectedRoutes";

import LandingPage from "./components/landing-page/landing-page-wrapper";
import AccountSetup from "./components/account-setup/account-setup";
import Dashboard from "./components/home/dashboard";
import Profile from "./components/profile/profile";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/account-setup' element={<ProtectedRoutes><AccountSetup /></ProtectedRoutes>} />
          <Route path='/dashboard' element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
          <Route path='/profile' element={<ProtectedRoutes><Profile /></ProtectedRoutes>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
