import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "../lib/auth.mjs";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 4 * 1024 * 1024;

// POST /api/images   – העלאת תמונת מוצר (רק עם סיסמת ניהול), מחזיר { url }
// GET  /uploads/:id  – הצגת התמונה באתר
export default async (req, context) => {
  const store = getStore({ name: "quickmarket-images", consistency: "strong" });

  if (req.method === "GET" && context.params.id) {
    const found = await store.getWithMetadata(context.params.id, { type: "arrayBuffer" });
    if (!found) return new Response("Not found", { status: 404 });
    return new Response(found.data, {
      headers: {
        "content-type": found.metadata?.type || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (req.method === "POST" && !context.params.id) {
    const denied = await requireAdmin(req);
    if (denied) return denied;
    const type = (req.headers.get("content-type") || "").split(";")[0].trim();
    if (!TYPES[type]) return json({ error: "bad-type", message: "רק תמונות JPG / PNG / WEBP / GIF" }, 415);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return json({ error: "empty" }, 400);
    if (buf.byteLength > MAX_BYTES) return json({ error: "too-big", message: "התמונה גדולה מדי" }, 413);
    const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${TYPES[type]}`;
    await store.set(id, buf, { metadata: { type } });
    return json({ url: `/uploads/${id}` });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: ["/api/images", "/uploads/:id"] };
