// lib/http.ts — helper สำหรับ route handler
import { NextResponse } from "next/server";

export const noStore = { "Cache-Control": "no-store" };
export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(data, { status, headers: { ...noStore, ...headers } });
export const err = (code: string, status: number, extra: Record<string, unknown> = {}) => json({ error: code, ...extra }, status);

export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 300_000): Promise<T | null> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
