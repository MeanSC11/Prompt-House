// ใช้ fetch ของ Node 18+ ได้เลย (ถ้า Node < 18 ให้ลง node-fetch แล้ว import แทน)
const BASE = process.env.LLM_BASE_URL || "http://localhost:11434";
const MODEL = process.env.LLM_MODEL || "llama3";

/**
 * เรียก Ollama แบบข้อความเดี่ยว (prompt) ด้วย /api/generate
 * - ถ้าอยากใช้ฟอร์แมต Chat (messages) เปลี่ยนไปใช้ /v1/chat/completions ด้านล่าง
 */
export async function generateText(prompt) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // stream:false จะให้ผลลัพธ์มาเป็นก้อนเดียว อ่านง่าย
    body: JSON.stringify({ model: MODEL, prompt, stream: false }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${txt}`);
  }

  const data = await res.json(); // { response: "...", done: true, ... }
  return data.response ?? "";
}

/**
 * (ตัวเลือก) เรียกแบบ OpenAI-compatible /v1/chat/completions
 * ใช้เมื่อฝั่ง Frontend/Backend อยากส่ง messages หลาย turn
 */
export async function chatCompletions(messages) {
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,           // [{role:'user'|'assistant'|'system', content:'...'}]
      temperature: 0.7,
      stream: false
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama (chat) error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  // โครงสร้างจะคล้าย OpenAI: data.choices[0].message.content
  return data?.choices?.[0]?.message?.content ?? "";
}
