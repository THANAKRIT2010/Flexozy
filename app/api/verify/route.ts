// POST /api/verify — ตรวจ token Cloudflare Turnstile ฝั่งเซิร์ฟเวอร์ แล้วออก "ตั๋ว" (คุกกี้) ผูกกับ UA + เครือข่าย IP
import { NextRequest } from "next/server";
import { IS_PROD, SESSION_SECRET, TURNSTILE_SECRET } from "@/lib/env";
import { GATE_COOKIE, GATE_TTL_SEC, issueGateToken } from "@/lib/gate";
import { err, json, readJson, str } from "@/lib/http";
import { getIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  if (!SESSION_SECRET || !TURNSTILE_SECRET) return err("server_not_configured", 503);
  const body = await readJson<{ token?: string }>(req, 5000);
  const token = str(body?.token, 4096);
  if (!token) return err("missing_token", 400);

  const ip = getIp(req.headers);
  const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
  if (ip !== "unknown") form.set("remoteip", ip);

  let ok = false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    ok = !!d?.success;
  } catch {
    return err("captcha_unreachable", 502);
  }
  if (!ok) return err("captcha_failed", 403);

  const res = json({ ok: true });
  res.cookies.set(GATE_COOKIE, await issueGateToken(req.headers.get("user-agent") || "", ip), {
    httpOnly: true, secure: IS_PROD, sameSite: "lax", path: "/", maxAge: GATE_TTL_SEC,
  });
  return res;
}
