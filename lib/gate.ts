// lib/gate.ts — ตั๋วผ่านด่าน captcha (HMAC-SHA256 ด้วย Web Crypto → ใช้ได้ใน Edge middleware)
// รูปแบบ: v1.<หมดอายุ(วินาที)>.<bind>.<ลายเซ็น>   bind = hash(User-Agent + เครือข่าย IP)
// ผูกกับ UA+เครือข่ายเพื่อกันการเอาคุกกี้ที่ผ่าน captcha แล้วไปแจกบอทตัวอื่นใช้ต่อ
import { SESSION_SECRET } from "./env";
import { ipPrefix } from "./ip";

export const GATE_COOKIE = "fx_gate";
export const GATE_TTL_SEC = 60 * 60 * 6; // 6 ชั่วโมง แล้วต้องยืนยันใหม่

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode("gate:" + SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

async function bindOf(ua: string, ip: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(ua + "|" + ipPrefix(ip)));
  return toHex(h).slice(0, 16);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function issueGateToken(ua: string, ip: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + GATE_TTL_SEC;
  const bind = await bindOf(ua, ip);
  const body = `v1.${exp}.${bind}`;
  return `${body}.${await hmac(body)}`;
}

export async function verifyGateToken(token: string | undefined, ua: string, ip: string): Promise<boolean> {
  if (!token || !SESSION_SECRET) return false; // ไม่ได้ตั้ง SESSION_SECRET บน production = ปิดทุกอย่างไว้ก่อน (fail-closed)
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [, expStr, bind, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  if (!safeEqual(sig, await hmac(`v1.${expStr}.${bind}`))) return false;
  return safeEqual(bind, await bindOf(ua, ip));
}
