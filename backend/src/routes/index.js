import express from "express";
import { generateText /*, chatCompletions */ } from "../services/ollama.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// เวอร์ชันง่าย: รับ message เดียว → ตอบจาก /api/generate
router.post("/chat", async (req, res) => {
  try {
    const { message, messages } = req.body || {};

    let reply = "";
    if (Array.isArray(messages) && messages.length) {
      // ถ้า Frontend ส่งเป็น messages (chat history) ให้ใช้แบบ chat
      // reply = await chatCompletions(messages);
      // ถ้ายังไม่ใช้ chat history ก็ใช้ message เดี่ยวก่อน:
      const lastUser = messages.findLast(m => m.role === "user")?.content || "";
      reply = await generateText(lastUser);
    } else {
      // ข้อความเดี่ยว
      reply = await generateText(message || "");
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "LLM error", detail: String(err?.message || err) });
  }
});

export { router };
