// lib/session.ts — session เก็บในคุกกี้ที่เซ็นด้วย JWT (HS256) ไม่ต้องมี storage ฝั่งเซิร์ฟเวอร์
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ADMIN_DISCORD_IDS, IS_PROD, SESSION_SECRET } from "./env";

export type SessionUser = { id: string; name: string; avatar: string };
const COOKIE = "fx_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const key = () => new TextEncoder().encode("session:" + SESSION_SECRET);

export async function getUser(): Promise<SessionUser | null> {
  if (!SESSION_SECRET) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.id !== "string") return null;
    return { id: payload.id, name: String(payload.name || ""), avatar: String(payload.avatar || "") };
  } catch {
    return null;
  }
}

export async function setUser(u: SessionUser) {
  const token = await new SignJWT({ ...u }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: IS_PROD, sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function clearUser() {
  (await cookies()).delete(COOKIE);
}

// เช็คสดจาก ENV ทุกครั้ง — ถอดชื่อออกจาก ADMIN_DISCORD_IDS แล้ว redeploy สิทธิ์หายทันที แม้คุกกี้ยังไม่หมดอายุ
export const isAdmin = (u: SessionUser | null) => !!u && ADMIN_DISCORD_IDS.includes(u.id);
