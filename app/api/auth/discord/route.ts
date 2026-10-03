// GET /api/auth/discord — เริ่ม OAuth (สร้าง state เก็บในคุกกี้ชั่วคราว กัน CSRF)
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { DISCORD, IS_PROD } from "@/lib/env";

export async function GET() {
  if (!DISCORD.clientId) return new NextResponse("Discord login is not configured", { status: 503 });
  const state = crypto.randomBytes(24).toString("hex");
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD.clientId);
  url.searchParams.set("redirect_uri", DISCORD.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DISCORD.botToken && DISCORD.guildId ? "identify guilds.join" : "identify");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "none");
  const res = NextResponse.redirect(url);
  res.cookies.set("fx_oauth", state, { httpOnly: true, secure: IS_PROD, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
