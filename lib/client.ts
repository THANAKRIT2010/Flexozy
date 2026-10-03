"use client";
// lib/client.ts — fetch helper ฝั่งเบราว์เซอร์: ถ้าตั๋ว captcha หมดอายุ จะพาไปยืนยันใหม่อัตโนมัติ
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = { ...(init.body ? { "Content-Type": "application/json" } : {}), ...((init.headers as Record<string, string>) || {}) };
  const res = await fetch(path, { ...init, headers, credentials: "same-origin" });
  let data: any = null;
  if (res.status !== 204) { try { data = await res.json(); } catch { data = null; } }
  if (res.status === 403 && data?.error === "captcha_required" && location.pathname !== "/verify") {
    location.href = "/verify?next=" + encodeURIComponent(location.pathname + location.search);
  }
  return { ok: res.ok, status: res.status, data };
}

export const extractId = (v: string) => (String(v || "").match(/(\d{5,15})/) || [])[1] || null;
