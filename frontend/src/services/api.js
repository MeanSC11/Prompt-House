const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export async function* streamChat({ apiBase = `${API_BASE}`, messages, temperature = 0.7, max_tokens = 1024 }) {
  const resp = await fetch(`${apiBase}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, temperature, max_tokens })
  });
  if (!resp.ok || !resp.body) throw new Error("Chat API error");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const c of chunks) {
      if (!c.startsWith("data:")) continue;
      const data = c.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        if (json.delta) yield json.delta;
      } catch {}
    }
  }
}
