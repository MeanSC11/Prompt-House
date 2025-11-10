
/*import express from "express";

export const router = express.Router();

// Route test Backend online
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend API working!",
    time: new Date().toISOString(),
  });
});
*/

// src/routes/index.js
import express from "express";
const router = express.Router();

// ✅ route เดิมที่มีอยู่
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ route ใหม่สำหรับ AI chat
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  // (mock response ก่อน — เดี๋ยวต่อจริงกับ LLM ทีหลัง)
  const reply = `AI: ผมได้รับข้อความ "${message}" แล้วครับ 😄\nกำลังเตรียมแบบบ้านที่เข้ากับคำอธิบายนี้อยู่...`;

  res.json({ reply });
});

export { router };
