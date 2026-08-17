// controllers/vault.controller.js — วางโค้ด -> แปลงเป็นลิงก์ของเรา ตั้งรหัสผ่านได้
// รหัสผ่านเก็บแบบ hash (scrypt) ไม่เก็บ plain text และตัวสคริปต์จะไม่ถูกส่งออกไปจนกว่าจะปลดล็อกถูกต้อง
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const { mutate, readDB } = require("../db");
const { hasPermission } = require("../middleware/requireAuth");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const check = crypto.scryptSync(password || "", salt, 64).toString("hex");
  // ใช้ timingSafeEqual กัน timing attack
  const a = Buffer.from(check, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function toPublicMeta(v) {
  return {
    code: v.code,
    title: v.title,
    image: v.image || "",
    has_password: !!v.password_hash,
    owner_name: v.owner_name,
    views: v.views,
    created_at: v.created_at,
  };
}

// POST /api/vault — ต้อง login, สร้างลิงก์ใหม่จากโค้ดที่วาง
function createVaultLink(req, res) {
  const { title, script, password, image } = req.body;
  if (!script || !String(script).trim()) {
    return res.status(400).json({ error: "empty_script" });
  }

  const user = req.session.user;
  let password_hash = null;
  let password_salt = null;
  if (password && String(password).trim()) {
    const { salt, hash } = hashPassword(String(password).trim());
    password_hash = hash;
    password_salt = salt;
  }

  const entry = {
    code: nanoid(8),
    title: title ? String(title).slice(0, 120) : "สคริปต์ไม่มีชื่อ",
    image: image ? String(image).slice(0, 500) : "",
    script: String(script).slice(0, 200_000),
    password_hash,
    password_salt,
    owner_id: user.discord_id,
    owner_name: user.username,
    views: 0,
    created_at: Math.floor(Date.now() / 1000),
  };

  mutate((db) => db.vault.push(entry));
  res.status(201).json({ code: entry.code, has_password: !!password_hash });
}

// PUT /api/vault/:code — เจ้าของลิงก์ (หรือทีมงานที่มีสิทธิ์ 'vault') แก้ไขชื่อ/โค้ด/รหัสผ่านได้
function updateVaultLink(req, res) {
  const user = req.session.user;
  const { title, script, password, remove_password, image } = req.body;

  const result = mutate((db) => {
    const v = db.vault.find((v) => v.code === req.params.code);
    if (!v) return { ok: false, code: 404 };
    if (v.owner_id !== user.discord_id && !hasPermission(user, "vault")) {
      return { ok: false, code: 403 };
    }
    if (title !== undefined) v.title = String(title).slice(0, 120);
    if (image !== undefined) v.image = String(image).slice(0, 500);
    if (script !== undefined) {
      if (!String(script).trim()) return { ok: false, code: 400, error: "empty_script" };
      v.script = String(script).slice(0, 200_000);
    }
    if (remove_password) {
      v.password_hash = null;
      v.password_salt = null;
    } else if (password && String(password).trim()) {
      const { salt, hash } = hashPassword(String(password).trim());
      v.password_hash = hash;
      v.password_salt = salt;
    }
    return { ok: true, entry: v };
  });

  if (!result.ok) return res.status(result.code).json({ error: result.error || "cannot_update" });
  res.json(toPublicMeta(result.entry));
}

// GET /api/vault/mine — ต้อง login, ดูลิงก์ของตัวเอง (ไม่โชว์เนื้อโค้ด)
function listMine(req, res) {
  const db = readDB();
  const mine = db.vault
    .filter((v) => v.owner_id === req.session.user.discord_id)
    .sort((a, b) => b.created_at - a.created_at)
    .map(toPublicMeta);
  res.json(mine);
}

// GET /api/vault — แอดมินเท่านั้น, ดูลิงก์ทั้งหมดในระบบ (ไม่โชว์เนื้อโค้ดจนกว่าจะกดดูรายอัน)
function listAll(req, res) {
  const db = readDB();
  const all = db.vault.slice().sort((a, b) => b.created_at - a.created_at).map(toPublicMeta);
  res.json(all);
}

// GET /api/vault/:code/meta — public, เช็คว่าลิงก์มีจริงไหม/ต้องใส่รหัสไหม โดยไม่เปิดเนื้อโค้ด
function getMeta(req, res) {
  const db = readDB();
  const v = db.vault.find((v) => v.code === req.params.code);
  if (!v) return res.status(404).json({ error: "not_found" });
  res.json(toPublicMeta(v));
}

// POST /api/vault/:code/unlock — public, ใส่รหัส (ถ้ามี) เพื่อดูโค้ดจริง
function unlock(req, res) {
  const db = readDB();
  const v = db.vault.find((v) => v.code === req.params.code);
  if (!v) return res.status(404).json({ error: "not_found" });

  if (v.password_hash) {
    const { password } = req.body;
    if (!password || !verifyPassword(String(password), v.password_salt, v.password_hash)) {
      return res.status(401).json({ error: "wrong_password" });
    }
  }

  mutate((db) => {
    const item = db.vault.find((item) => item.code === v.code);
    if (item) item.views = (item.views || 0) + 1;
  });

  res.json({ title: v.title, script: v.script });
}

// GET /api/vault/:code/admin-view — เจ้าของลิงก์ หรือทีมงานที่มีสิทธิ์ 'vault' เท่านั้น
// เจ้าของใช้ endpoint นี้เปิดดูโค้ดตัวเองได้เลยแม้ตั้งรหัสผ่านไว้ (ไม่ต้องกรอกรหัสตัวเอง) เพื่อไปแก้ไขต่อ
function adminView(req, res) {
  const db = readDB();
  const v = db.vault.find((v) => v.code === req.params.code);
  if (!v) return res.status(404).json({ error: "not_found" });
  const user = req.session.user;
  if (v.owner_id !== user.discord_id && !hasPermission(user, "vault")) {
    return res.status(403).json({ error: "forbidden" });
  }
  res.json({ title: v.title, image: v.image || "", script: v.script, owner_name: v.owner_name, has_password: !!v.password_hash });
}

// DELETE /api/vault/:code — เจ้าของลิงก์หรือแอดมินเท่านั้น
function removeVaultLink(req, res) {
  const user = req.session.user;
  const result = mutate((db) => {
    const idx = db.vault.findIndex((v) => v.code === req.params.code);
    if (idx === -1) return { ok: false, code: 404 };
    if (db.vault[idx].owner_id !== user.discord_id && !user.is_admin) {
      return { ok: false, code: 403 };
    }
    db.vault.splice(idx, 1);
    return { ok: true };
  });
  if (!result.ok) return res.status(result.code).json({ error: "cannot_delete" });
  res.status(204).end();
}

// เช็คว่า request นี้มาจากตัวเกม Roblox เอง (ผ่าน game:HttpGet) หรือมาจากเบราว์เซอร์ปกติ
// อ้างอิงจาก User-Agent ที่ Roblox HttpService ส่งมา (เช่น "Roblox/WinInet", "RobloxStudio/WinInet")
// หมายเหตุ: User-Agent ปลอมแปลงได้ง่าย นี่ไม่ใช่การป้องกันความปลอดภัยที่แน่นหนา
// เป็นเพียงตัวกันคนทั่วไปที่เปิดลิงก์ raw ดูตรงๆ ผ่านเบราว์เซอร์เท่านั้น
function isGameClient(req) {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  return ua.includes("roblox");
}

// GET /raw/vault/:code — เส้นทางจริงบนเซิร์ฟเวอร์ (ไม่ใช่ #hash) ตอบกลับเป็น text/plain ล้วนๆ
// ใช้ยิงตรงจาก loadstring(game:HttpGet("...")) ได้เลย เหมือนลิงก์ raw ของ GitHub
// ถ้าลิงก์มีรหัสผ่าน:
//   - Roblox client (loadstring/HttpGet) -> ข้ามการเช็ครหัสผ่าน รันได้ทันที
//   - เบราว์เซอร์ปกติ -> ต้องต่อ ?password=รหัสผ่าน ท้าย URL ให้ถูกต้อง ไม่งั้น 401
function rawView(req, res) {
  const db = readDB();
  const v = db.vault.find((v) => v.code === req.params.code);

  if (!v) {
    return res.status(404).type("text/plain").send("-- [Luader HUB] ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว");
  }

  if (v.password_hash && !isGameClient(req)) {
    const password = req.query.password;
    if (!password || !verifyPassword(String(password), v.password_salt, v.password_hash)) {
      return res
        .status(401)
        .type("text/plain")
        .send("ยามจะมองจ้องเธอครั้งใดพูดออกมาจากใจว่าเธอใช่เลย");
    }
  }

  mutate((db2) => {
    const item = db2.vault.find((item) => item.code === v.code);
    if (item) item.views = (item.views || 0) + 1;
  });
  res.type("text/plain; charset=utf-8").send(v.script);
}

module.exports = { createVaultLink, listMine, listAll, getMeta, unlock, adminView, updateVaultLink, removeVaultLink, rawView };
