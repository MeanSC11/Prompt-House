// src/pages/LandingPage.jsx
import React from "react";

export default function LandingPage() {
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1>Prompt House</h1>
        <p>หน้านี้จะเป็น Landing/Portal ในภายหลัง</p>
        <p>
          <a href="/designer" style={{ color: "#0f2b5b" }}>
            ไปที่ Designer
          </a>
        </p>
      </div>
    </div>
  );
}
