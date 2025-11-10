// src/services/apijs.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
