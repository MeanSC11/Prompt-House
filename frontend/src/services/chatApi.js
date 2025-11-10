// src/services/chatApi.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function sendToAI(message) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) throw new Error("Chat API failed");

    const data = await res.json();

    return {
      role: "assistant",
      content: data.reply || "(AI didn’t respond)",
    };
  } catch (err) {
    console.error("sendToAI error:", err);
    return {
      role: "assistant",
      content: "❗ มีปัญหาในการติดต่อกับเซิร์ฟเวอร์ AI",
    };
  }
}
