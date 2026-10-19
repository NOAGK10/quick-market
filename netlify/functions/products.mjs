import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "../lib/auth.mjs";

// GET  /api/products – התוכן של האתר (פתוח לכולם)
// PUT  /api/products – שמירת התוכן (רק עם סיסמת ניהול)
// POST /api/login    – בדיקת סיסמה בלבד
export default async (req) => {
  const { pathname } = new URL(req.url);
  const store = getStore({ name: "quickmarket", consistency: "strong" });

  if (pathname === "/api/login") {
    if (req.method !== "POST") return json({ error: "method" }, 405);
    return (await requireAdmin(req)) || json({ ok: true });
  }

  if (req.method === "GET") {
    const data = await store.get("data", { type: "json" });
    return json(data || null);
  }

  if (req.method === "PUT") {
    const denied = await requireAdmin(req);
    if (denied) return denied;
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad-json" }, 400);
    }
    const { site, categories, products } = body || {};
    if (!site || typeof site !== "object" || !Array.isArray(categories) || !Array.isArray(products)) {
      return json({ error: "bad-data" }, 400);
    }
    const updatedAt = new Date().toISOString();
    await store.setJSON("data", { site, categories, products, updatedAt });
    return json({ ok: true, updatedAt });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: ["/api/products", "/api/login"] };
