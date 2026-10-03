// lib/env.ts — อ่านค่า env ที่เดียว (ใช้ได้ทั้ง Edge middleware และ Node route)
const isProd = process.env.NODE_ENV === "production";

export const IS_PROD = isProd;

export const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : isProd
      ? "" // production ต้องตั้งเอง — ถ้าไม่ตั้งจะ fail-closed (ดู lib/session.ts / lib/gate.ts)
      : "dev-only-secret-dev-only-secret-dev-only-secret";

// ค่าทดสอบของ Cloudflare — ผ่านเสมอ ใช้เฉพาะตอน dev เท่านั้น
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (isProd ? "" : "1x00000000000000000000AA");
export const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || (isProd ? "" : "1x0000000000000000000000000000000AA");

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const API_HOST = (process.env.NEXT_PUBLIC_API_HOST || "").toLowerCase();

export const ADMIN_DISCORD_IDS = (process.env.ADMIN_DISCORD_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DISCORD = {
  clientId: process.env.DISCORD_CLIENT_ID || "",
  clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
  redirectUri: process.env.DISCORD_REDIRECT_URI || `${SITE_URL}/api/auth/discord/callback`,
  botToken: process.env.DISCORD_BOT_TOKEN || "",
  guildId: process.env.DISCORD_GUILD_ID || "",
};

export const RL_SCALE = Number(process.env.RL_SCALE) > 0 ? Number(process.env.RL_SCALE) : 1;
