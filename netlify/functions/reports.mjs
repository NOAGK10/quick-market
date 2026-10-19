import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "../lib/auth.mjs";

const REASONS = ["price", "gone", "link", "other"];
const MAX_REPORTS = 500;
const clip = (s, n) => String(s || "").trim().slice(0, n);

// POST   /api/reports      – לקוח מדווח על מוצר (פתוח לכולם)
// GET    /api/reports      – רשימת הדיווחים (רק עם סיסמת ניהול)
// DELETE /api/reports/:id  – סימון דיווח כמטופל (רק עם סיסמת ניהול)
export default async (req, context) => {
  const store = getStore({ name: "quickmarket-reports", consistency: "strong" });

  if (req.method === "POST" && !context.params.id) {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad-json" }, 400);
    }
    if (body.website) return json({ ok: true }); // מלכודת לבוטים
    if (!REASONS.includes(body.reason) || !body.productId) return json({ error: "bad-data" }, 400);
    const { blobs } = await store.list();
    if (blobs.length >= MAX_REPORTS) return json({ error: "full" }, 429);
    const at = new Date().toISOString();
    const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;
    await store.setJSON(id, {
      id,
      at,
      reason: body.reason,
      productId: clip(body.productId, 60),
      productTitle: clip(body.productTitle, 200),
      note: clip(body.note, 500),
    });
    return json({ ok: true });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const reports = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    reports.sort((a, b) => (a.at < b.at ? 1 : -1));
    return json(reports);
  }

  if (req.method === "DELETE" && context.params.id) {
    await store.delete(context.params.id);
    return json({ ok: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: ["/api/reports", "/api/reports/:id"] };
