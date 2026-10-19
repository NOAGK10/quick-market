import { createHash, timingSafeEqual } from "node:crypto";

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const sha = (s) => createHash("sha256").update(String(s)).digest();

// הסיסמה מוגדרת ב-Netlify כמשתנה סביבה בשם ADMIN_PASSWORD.
// הדפדפן שולח אותה בכותרת x-admin-password (מקודדת, כדי לתמוך בעברית).
export async function requireAdmin(req) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected) return json({ error: "no-password", message: "לא הוגדרה סיסמת ניהול ב-Netlify" }, 503);
  let given = "";
  try {
    given = decodeURIComponent(req.headers.get("x-admin-password") || "");
  } catch {}
  if (timingSafeEqual(sha(given), sha(expected))) return null;
  await new Promise((r) => setTimeout(r, 800)); // מאט ניחושי סיסמה
  return json({ error: "wrong-password", message: "סיסמה שגויה" }, 401);
}
