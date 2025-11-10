// src/App.js
import React from "react";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";

function App() {
  const path = window.location.pathname;

  if (path === "/designer") {
    return <MainPage />;
  }

  // default: landing
  return <LandingPage />;
}

export default App;
