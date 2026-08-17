// controllers/partners.controller.js — จัดการพาร์ทเนอร์ (แสดงผลสาธารณะ / แก้ไขได้เฉพาะแอดมินหรือทีมงานที่มีสิทธิ์ 'partners')
// การเช็คสิทธิ์ทำที่ middleware requirePermission('partners') ใน routes/partners.routes.js แล้ว ไม่ต้องเช็คซ้ำในนี้
const { mutate, readDB } = require("../db");
const { notifyEvent } = require("../services/notifyService");

// GET /api/partners
function listPartners(req, res) {
  const db = readDB();
  res.json(db.partners);
}

// POST /api/partners
function addPartner(req, res) {
  const { discord_id, username, avatar, description, discord_invite } = req.body;
  if (!discord_id || !username) return res.status(400).json({ error: "missing_fields" });

  const partner = {
    discord_id,
    username,
    avatar: avatar || "",
    description: (description || "").slice(0, 400),
    discord_invite: discord_invite || "",
  };
  mutate((db) => db.partners.push(partner));
  notifyEvent("partner_new", { title: "🤝 มีพาร์ทเนอร์ใหม่", description: partner.username });
  res.status(201).json(partner);
}

// PUT /api/partners/:discord_id — แก้ไขข้อมูลพาร์ทเนอร์ที่มีอยู่แล้ว
function updatePartner(req, res) {
  const { username, avatar, description, discord_invite } = req.body;
  let updated = null;
  mutate((db) => {
    const partner = db.partners.find((p) => p.discord_id === req.params.discord_id);
    if (!partner) return;
    if (username !== undefined) partner.username = username;
    if (avatar !== undefined) partner.avatar = avatar;
    if (description !== undefined) partner.description = String(description).slice(0, 400);
    if (discord_invite !== undefined) partner.discord_invite = discord_invite;
    updated = partner;
  });
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json(updated);
}

// DELETE /api/partners/:discord_id
function removePartner(req, res) {
  mutate((db) => {
    db.partners = db.partners.filter((p) => p.discord_id !== req.params.discord_id);
  });
  res.status(204).end();
}

module.exports = { listPartners, addPartner, updatePartner, removePartner };
