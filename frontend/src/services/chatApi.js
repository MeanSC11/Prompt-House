const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export async function sendToAI(text) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // แบบ message เดี่ยว
    body: JSON.stringify({ message: text }),

    // ถ้าจะส่งเป็นหลาย messages (history):
    // body: JSON.stringify({ messages: [{role:'user', content:text}] }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return { role: "assistant", content: data.reply || "(no content)" };
}

export async function streamChat(onDelta, { messages }) {
  // เวอร์ชัน stream – เว้นไว้ก่อน (ต้องทำฝั่ง backend เป็น SSE/stream)
}