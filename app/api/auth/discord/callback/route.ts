import { NextRequest, NextResponse } from "next/server";
import { DISCORD, SITE_URL } from "@/lib/env";
import { setUser } from "@/lib/session";

const fail = (msg: string, status = 400) => new NextResponse(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get("fx_oauth")?.value;
  if (!code || !state || !saved || state !== saved) return fail("Invalid OAuth state — กรุณา login ใหม่อีกครั้ง");

  try {
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD.clientId, client_secret: DISCORD.clientSecret, grant_type: "authorization_code",
        code, redirect_uri: DISCORD.redirectUri,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenRes.ok) return fail("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 502);
    const { access_token } = await tokenRes.json();

    const meRes = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(10000) });
    if (!meRes.ok) return fail("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 502);
    const u = await meRes.json();

    // เข้าเซิร์ฟเวอร์ Discord อัตโนมัติ (ถ้าตั้งค่าบอทไว้) — พลาดก็ไม่ทำให้ login ล้ม
    if (DISCORD.botToken && DISCORD.guildId) {
      fetch(`https://discord.com/api/v10/guilds/${DISCORD.guildId}/members/${u.id}`, {
        method: "PUT",
        headers: { Authorization: `Bot ${DISCORD.botToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    }

    const avatar = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> BigInt(22)) % BigInt(6))}.png`;
    await setUser({ id: String(u.id), name: String(u.global_name || u.username || "user").slice(0, 60), avatar });

    const res = NextResponse.redirect(`${SITE_URL}/`);
    res.cookies.delete("fx_oauth");
    return res;
  } catch {
    return fail("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 500);
  }
}
