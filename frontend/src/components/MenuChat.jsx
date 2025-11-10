// src/components/MenuChat.jsx
import React, { useState } from "react";
import { sendToAI } from "../services/chatApi";

export default function MenuChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "สวัสดีครับ 👋\nผมคือ AI ของ Prompt House\nเล่าไอเดียบ้านที่คุณอยากได้ให้ฟังหน่อยสิ",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiMsg = await sendToAI(trimmed);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "❗ มีปัญหาในการคุยกับ AI (mock อยู่ตอนนี้)\nเดี๋ยวจะลองใหม่ให้ทีหลังนะครับ",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickStart = () => {
    const question =
      "I want to design a new house. Please help me figure out what kind of house suits me.";
    sendMessage(question);
  };

  return (
    <>
      {/* สไตล์สำหรับ placeholder ให้เป็นสีขาว */}
      <style>
        {`
          input.ph-chat-input::placeholder {
            color: #ffffff;
            opacity: 1;
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "26vw",
          maxWidth: 360,
          minWidth: 260,
          background: "#CAF0F8",
          boxShadow: "4px 0 25px rgba(15,23,42,0.25)",
          zIndex: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* แถบด้านบน */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 8px 18px",
            color: "#0f2b5b",
          }}
        >
          <div style={{ fontSize: 22, cursor: "pointer" }}>☰</div>
          <div style={{ fontWeight: 600 }}>Prompt House</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              cursor: "pointer",
              color: "#0f2b5b",
            }}
          >
            «
          </button>
        </div>

        {/* กล่องข้อความแชท */}
        <div
          style={{
            flex: 1,
            margin: "8px 14px 0 14px",
            padding: "10px 10px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.7)",
            overflowY: "auto",
            fontSize: 13,
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent:
                  m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  whiteSpace: "pre-wrap",
                  padding: "8px 10px",
                  borderRadius: 14,
                  background:
                    m.role === "user" ? "#00B4D8" : "#E5E7EB",
                  color: m.role === "user" ? "#FFFFFF" : "#0f172a",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              AI กำลังคิดไอเดียบ้านให้คุณอยู่...
            </div>
          )}
        </div>

        {/* แถบพิมพ์ข้อความ (Enter เพื่อส่งข้อความ) */}
        <div
          style={{
            background: "#CAF0F8",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderTop: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#00B4D8",
              borderRadius: 999,
              padding: "10px 14px",
              width: "100%",
              boxShadow: "0 6px 16px rgba(0,180,216,0.3)",
            }}
          >
            {/* ปุ่ม + */}
            <button
              type="button"
              onClick={handleQuickStart}
              style={{
                border: "none",
                background: "transparent",
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 700,
                cursor: "pointer",
                marginRight: 10,
              }}
            >
              +
            </button>

            {/* ช่องพิมพ์ข้อความ */}
            <input
              type="text"
              className="ph-chat-input"
              placeholder="Tell me your idea house?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                color: "#FFFFFF",
                fontSize: 14,
                outline: "none",
              }}
            />
          </form>
        </div>
      </div>
    </>
  );
}
