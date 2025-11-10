// src/pages/MainPage.jsx
import React, { useState } from "react";
import Canvas3D from "../components/Canvas3D";
import Toolbar3D from "../components/Toolbar3D";
import MenuChat from "../components/MenuChat";

export default function MainPage() {
  const [tool, setTool] = useState("select");
  const [menuOpen, setMenuOpen] = useState(true); // แชทเปิด/ปิด

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* ปุ่มเปิดเมนูด้านซ้าย (ถ้ายุบอยู่) */}
      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            position: "fixed",
            top: 12,
            left: 16,
            fontSize: 26,
            fontWeight: 600,
            color: "#0f2b5b",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            zIndex: 13,
          }}
        >
          »
        </button>
      )}

      {/* แถบ AI Chat ด้านซ้าย */}
      <MenuChat isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ฉาก 3D */}
      <Canvas3D tool={tool} />

      {/* Toolbar ล่าง – ส่งสถานะแชทเข้าไปด้วย */}
      <Toolbar3D
        tool={tool}
        setTool={setTool}
        isChatOpen={menuOpen}   // 👈 ตรงนี้สำคัญ
      />
    </div>
  );
}
