// GET /raw/vault/:code (และ https://api.โดเมน/CODE ผ่าน middleware) — text/plain สำหรับ loadstring(game:HttpGet(...))
// Roblox client ผ่านได้เสมอ / เบราว์เซอร์ที่ vault ตั้งรหัสผ่านไว้ ต้องใส่ ?password= (พฤติกรรมเดิมของระบบ)
// rate limit ต่อ IP และต่อโค้ดทำที่ middleware แล้ว
import { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/password";
import { addView, getVault } from "@/lib/vault";

const plain = (body: string, status = 200, extra: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff", ...extra } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const v = await getVault(code);
  if (!v) return plain("-- [Flexozy] ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว", 404, { "Cache-Control": "no-store" });

  const isGameClient = (req.headers.get("user-agent") || "").toLowerCase().includes("roblox");
  if (v.password_hash && v.password_salt && !isGameClient) {
    const pw = req.nextUrl.searchParams.get("password") || "";
    if (!pw || !verifyPassword(pw, v.password_salt, v.password_hash)) return plain("", 401, { "Cache-Control": "no-store" });
  }
  await addView(code);
  return plain(v.script, 200, { "Cache-Control": "no-store" });
}
