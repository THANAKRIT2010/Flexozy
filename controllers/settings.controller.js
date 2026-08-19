// controllers/settings.controller.js — ตั้งค่าเว็บไซต์ที่แอดมินปรับได้ (ไม่ต้องแก้โค้ด/redeploy)
const { mutate, readDB } = require("../db");

const EDITABLE_KEYS = [
  "site_name",
  "tagline",
  "logo_url",
  "discord_invite",
  "hero_note",
  "loading_image",
  "loading_text",
  "popup_image",
  "popup_title",
  "popup_code",
  "popup_desc",
  "popup_button_text",
  "popup_button_link",
];
const BOOLEAN_KEYS = ["popup_enabled"];

// GET /api/settings — public, frontend ใช้ตอนโหลดหน้าเว็บ
async function getSettings(req, res) {
  const db = await readDB();
  res.json(db.settings);
}

// PUT /api/settings — แอดมินเท่านั้น
async function updateSettings(req, res) {
  const updates = {};
  for (const key of EDITABLE_KEYS) {
    if (req.body[key] !== undefined) {
      updates[key] = String(req.body[key]).slice(0, 500);
    }
  }
  for (const key of BOOLEAN_KEYS) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key] === true || req.body[key] === "true" || req.body[key] === "1";
    }
  }
  const settings = await mutate((db) => {
    Object.assign(db.settings, updates);
    return db.settings;
  });
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
