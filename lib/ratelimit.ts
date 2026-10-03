// lib/ratelimit.ts — rate limit แบบ fixed-window บน Redis (ใช้ร่วมกันทุก instance)
// ถ้า Redis ล่ม จะ "ไม่ปล่อยผ่านฟรี" แต่ถอยไปใช้ตัวนับในหน่วยความจำของ instance นั้นแทน (ยังกันได้ระดับหนึ่ง)
import { getStore } from "./db";
import type { Rule } from "./limits";

export type RLResult = { ok: boolean; remaining: number; retryAfter: number; limit: number };

const mem = new Map<string, { n: number; exp: number }>();
function memIncr(key: string, windowSec: number) {
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
  const e = mem.get(key);
  if (!e || e.exp < now) {
    mem.set(key, { n: 1, exp: now + windowSec * 1000 });
    return { count: 1, ttl: windowSec };
  }
  e.n++;
  return { count: e.n, ttl: Math.max(1, Math.ceil((e.exp - now) / 1000)) };
}

/** subject = สิ่งที่จำกัด เช่น IP หรือ `${ip}:${code}` */
export async function rateLimit(rule: Rule, subject: string): Promise<RLResult> {
  const key = `rl:${rule.name}:${subject}`;
  let res: { count: number; ttl: number };
  try {
    res = await getStore().incr(key, rule.windowSec);
  } catch {
    res = memIncr(key, rule.windowSec);
  }
  const ok = res.count <= rule.max;
  let retryAfter = 0;
  if (!ok) {
    retryAfter = res.ttl;
    try {
      retryAfter = await getStore().ttl(key);
    } catch {
      /* ใช้ค่าประมาณ */
    }
  }
  return { ok, remaining: Math.max(0, rule.max - res.count), retryAfter, limit: rule.max };
}

export function tooMany(retryAfter: number, json = true): Response {
  const headers: Record<string, string> = { "Retry-After": String(retryAfter), "Cache-Control": "no-store" };
  if (json) {
    return new Response(JSON.stringify({ error: "too_many_requests", retry_after: retryAfter }), {
      status: 429,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  return new Response("-- [Flexozy] too many requests, retry later", { status: 429, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
}
