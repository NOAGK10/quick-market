import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "../lib/auth.mjs";

const MAX_PENDING = 300;
const clip = (s, n) => String(s || "").trim().slice(0, n);

// המלצות שלקוחות שולחים מהאתר מחכות כאן לאישור.
// המלצה שאושרה עוברת (דרך עמוד הניהול) לתוכן האתר – data.reviews.
// POST   /api/reviews      – לקוח שולח המלצה (פתוח לכולם)
// GET    /api/reviews      – המלצות שמחכות לאישור (רק עם סיסמת ניהול)
// DELETE /api/reviews/:id  – הסרה מרשימת ההמתנה (רק עם סיסמת ניהול)
export default async (req, context) => {
  const store = getStore({ name: "quickmarket-reviews", consistency: "strong" });

  if (req.method === "POST" && !context.params.id) {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad-json" }, 400);
    }
    if (body.website) return json({ ok: true }); // מלכודת לבוטים
    const name = clip(body.name, 40);
    const text = clip(body.text, 600);
    const rating = Math.round(Number(body.rating));
    if (!name || text.length < 5 || !(rating >= 1 && rating <= 5)) return json({ error: "bad-data" }, 400);
    const { blobs } = await store.list();
    if (blobs.length >= MAX_PENDING) return json({ error: "full" }, 429);
    const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;
    await store.setJSON(id, { id, at: new Date().toISOString(), name, text, rating });
    return json({ ok: true });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const list = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    list.sort((a, b) => (a.at < b.at ? 1 : -1));
    return json(list);
  }

  if (req.method === "DELETE" && context.params.id) {
    await store.delete(context.params.id);
    return json({ ok: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: ["/api/reviews", "/api/reviews/:id"] };
