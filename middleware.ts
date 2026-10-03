// middleware.ts — ด่านหน้าของเว็บทั้งหมด (รันบน Edge ก่อนถึงหน้า/API ทุกเส้นทาง)
//   1) โดเมน api.* → รับเฉพาะ GET /CODE (ลิงก์ loadstring) ที่เหลือ 404
//   2) ลิงก์ raw (/raw/vault/*) → ไม่ผ่าน captcha (Roblox client ผ่านไม่ได้) แต่ rate limit เข้มต่อ IP และต่อโค้ด
//   3) ที่เหลือ: rate limit ต่อ IP → ตรวจตั๋ว captcha → (ถ้าเป็น API เขียนข้อมูล) ตรวจ Origin กัน CSRF
import { NextRequest, NextResponse } from "next/server";
import { API_HOST } from "@/lib/env";
import { GATE_COOKIE, verifyGateToken } from "@/lib/gate";
import { getIp } from "@/lib/ip";
import { LIMITS, type Rule } from "@/lib/limits";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|images/).*)"],
};

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]);
const text = (body: string, status: number) =>
  new NextResponse(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
const json = (body: unknown, status: number) =>
  new NextResponse(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function pickRule(pathname: string, method: string): Rule {
  if (!pathname.startsWith("/api/")) return LIMITS.page;
  if (pathname === "/api/verify") return LIMITS.verify;
  if (pathname.startsWith("/api/roblox/check/")) return LIMITS.robloxCheck;
  if (pathname.startsWith("/api/roblox/audio/")) return LIMITS.robloxAudio;
  if (pathname === "/api/auth/discord") return LIMITS.login;
  return LIMITS.api;
}

async function guardRaw(req: NextRequest, ip: string, code: string) {
  if (req.method !== "GET" && req.method !== "HEAD") return text("-- not_found", 404);
  const a = await rateLimit(LIMITS.raw, ip);
  if (!a.ok) return tooMany(a.retryAfter, false);
  const b = await rateLimit(LIMITS.rawPerCode, `${ip}:${code}`);
  if (!b.ok) return tooMany(b.retryAfter, false);
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req.headers);
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();

  if (!ALLOWED_METHODS.has(req.method)) return text("method_not_allowed", 405);

  // ---- 1) โดเมน api.* (ลิงก์ raw สั้น https://api.example.com/CODE) ----
  if (API_HOST && host === API_HOST) {
    if (req.method !== "GET" && req.method !== "HEAD") return text("not_found", 404);
    const m = pathname.match(/^\/([A-Za-z0-9_-]{4,40})\/?$/);
    if (!m) return text("Flexozy Vault API", 200);
    const blocked = await guardRaw(req, ip, m[1]);
    if (blocked) return blocked;
    return NextResponse.rewrite(new URL(`/raw/vault/${m[1]}`, req.url));
  }

  // ---- 2) ลิงก์ raw บนโดเมนหลัก ----
  if (pathname.startsWith("/raw/vault/")) {
    const code = pathname.split("/")[3] || "";
    return (await guardRaw(req, ip, code)) ?? NextResponse.next();
  }

  // ---- 3) หน้าเว็บ + API ----
  const ua = req.headers.get("user-agent") || "";
  const isApi = pathname.startsWith("/api/");
  if (!ua) return isApi ? json({ error: "forbidden" }, 403) : text("forbidden", 403);

  const rl = await rateLimit(pickRule(pathname, req.method), ip);
  if (!rl.ok) return isApi ? (tooMany(rl.retryAfter) as NextResponse) : text("เข้าใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่", 429);

  // เขียนข้อมูล: ต้องมาจากเว็บเราเองเท่านั้น (กัน CSRF / ยิงข้ามเว็บ)
  if (isApi && req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const reqHost = req.headers.get("host") || "";
    if (origin) {
      let oh = "";
      try {
        oh = new URL(origin).host;
      } catch {}
      if (oh !== reqHost) return json({ error: "bad_origin" }, 403);
    } else {
      const site = req.headers.get("sec-fetch-site");
      if (site && site !== "same-origin" && site !== "none") return json({ error: "bad_origin" }, 403);
    }
    const w = await rateLimit(LIMITS.write, ip);
    if (!w.ok) return tooMany(w.retryAfter) as NextResponse;
  }

  // ---- ด่าน captcha ----
  const passed = await verifyGateToken(req.cookies.get(GATE_COOKIE)?.value, ua, ip);
  const isVerifyRoute = pathname === "/verify" || pathname === "/api/verify";

  if (passed && pathname === "/verify") {
    const next = req.nextUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/", req.url));
  }
  if (!passed && !isVerifyRoute) {
    if (isApi) return json({ error: "captcha_required" }, 403);
    if (req.method === "GET" || req.method === "HEAD") {
      const url = new URL("/verify", req.url);
      if (pathname !== "/") url.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    return text("forbidden", 403);
  }

  return NextResponse.next();
}
