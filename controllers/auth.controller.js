// controllers/auth.controller.js — จัดการ login/callback/me/logout ทั้งหมด
const { mutate, readDB } = require("../db");
const { buildProfile } = require("../utils/discordCdn");
const discordService = require("../services/discordService");
const presenceService = require("../services/presenceService");
const { notifyEvent } = require("../services/notifyService");

// GET /login/discord — เริ่ม flow, ขอ scope identify + guilds.join
async function loginWithDiscord(req, res) {
  const state = discordService.generateState();
  req.session.oauth_state = state;
  res.redirect(discordService.buildAuthorizeUrl(state));
}

// GET /callback/discord — Discord redirect กลับมาที่นี่พร้อม ?code=&state=
async function handleCallback(req, res) {
  const { code, state } = req.query;

  if (!code || !state || state !== req.session.oauth_state) {
    return res.status(400).send("Invalid OAuth state — กรุณา login ใหม่อีกครั้ง");
  }
  delete req.session.oauth_state;

  try {
    const accessToken = await discordService.exchangeCodeForToken(code);
    const discordUser = await discordService.fetchDiscordUser(accessToken);
    const profile = buildProfile(discordUser);

    // เช็คแบน — ถ้าโดนแบนอยู่ ปฏิเสธการ login ทันที ไม่สร้าง session ให้
    const dbCheck = await readDB();
    const ban = dbCheck.bans.find((b) => b.discord_id === profile.discord_id);
    if (ban) {
      return res.status(403).send(`บัญชีนี้ถูกระงับการใช้งาน\nเหตุผล: ${ban.reason}`);
    }

    // แคชโปรไฟล์ลง db เพื่อใช้โชว์ author card แม้ผู้ใช้ไม่ online
    // เก็บ first_seen ไว้ครั้งแรกที่เจอเท่านั้น (ใช้โชว์ในหน้าแอดมิน > สมาชิก)
    const isFirstLogin = !dbCheck.users[profile.discord_id];
    await mutate((db) => {
      const existing = db.users[profile.discord_id];
      db.users[profile.discord_id] = {
        ...profile,
        first_seen: existing?.first_seen || Math.floor(Date.now() / 1000),
        last_seen: Math.floor(Date.now() / 1000),
      };
    });
    if (isFirstLogin) {
      notifyEvent("member_new", { title: "👋 มีสมาชิกใหม่", description: `${profile.username} เข้าเว็บครั้งแรก` }).catch((e) => console.error("notifyEvent failed:", e.message));
    }

    // auto-join เข้าเซิร์ฟเวอร์ (ไม่ทำให้ login fail ถ้าพลาด)
    await discordService.autoJoinGuild(discordUser.id, accessToken);

    req.session.user = profile;
    req.session.access_token = accessToken;
    res.redirect(discordService.FRONTEND_URL + "/");
  } catch (err) {
    console.error("Discord OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }
}

// GET /api/me — แนบ permissions ปัจจุบันไปด้วยเสมอ (เช็คสดจาก db.team กันเคสแอดมินเพิ่งเปลี่ยนสิทธิ์แล้ว session เก่ายังไม่หาย)
async function me(req, res) {
  if (!req.session.user) return res.json({ authenticated: false });
  const db = await readDB();
  const member = db.team.find((m) => m.discord_id === req.session.user.discord_id);
  const permissions = member?.permissions || [];
  res.json({ authenticated: true, user: { ...req.session.user, permissions } });
}

// GET /logout
async function logout(req, res) {
  req.session = null; // cookie-session: ล้าง session ด้วยการตั้งเป็น null (ไม่มีเมธอด .destroy() แบบ express-session เดิม)
  res.redirect(discordService.FRONTEND_URL + "/");
}

// GET /api/profile/:discord_id — โปรไฟล์เต็มของใครก็ได้ที่เคย login (สำหรับ modal โปรไฟล์)
// ดึงสถานะออนไลน์/กำลังเล่นเกมอะไรอยู่สดจาก Discord Gateway มาแปะให้ด้วยถ้าระบบ presence พร้อม
async function getProfile(req, res) {
  const db = await readDB();
  const profile = db.users[req.params.discord_id];
  if (!profile) return res.status(404).json({ error: "not_found" });

  const scriptCount = db.scripts.filter((s) => s.author_id === req.params.discord_id).length;
  res.json({
    ...profile,
    script_count: scriptCount,
    presence: presenceService.getPresence(req.params.discord_id),
  });
}

module.exports = { loginWithDiscord, handleCallback, me, logout, getProfile };
