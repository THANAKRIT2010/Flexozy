// middleware/requireAuth.js — ใช้ครอบ route ที่ต้อง login ก่อนถึงเข้าได้
const { readDB } = require("../db");

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "not_authenticated" });
  }
  next();
}

// requireAdmin — ใช้ครอบ route ที่แอดมินเต็ม (ADMIN_DISCORD_IDS) เท่านั้นเข้าได้
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "not_authenticated" });
  }
  if (!req.session.user.is_admin) {
    return res.status(403).json({ error: "admin_only" });
  }
  next();
}

// hasPermission — เช็คสดจาก db.team ทุกครั้ง (ไม่พึ่ง session cache) เผื่อแอดมินเพิ่งเปลี่ยนสิทธิ์
// แอดมินเต็มผ่านเสมอ ไม่ต้องมีชื่ออยู่ในทีมงานก็ได้
function hasPermission(user, permKey) {
  if (!user) return false;
  if (user.is_admin) return true;
  const db = readDB();
  const member = db.team.find((m) => m.discord_id === user.discord_id);
  return !!member && Array.isArray(member.permissions) && member.permissions.includes(permKey);
}

// requirePermission(key) — ใช้ครอบ route ที่ต้องมีสิทธิ์ย่อยเฉพาะส่วน (หรือเป็นแอดมินเต็ม)
function requirePermission(permKey) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "not_authenticated" });
    }
    if (!hasPermission(req.session.user, permKey)) {
      return res.status(403).json({ error: "permission_denied", permission: permKey });
    }
    next();
  };
}

// requireStaff — ใช้ครอบ route ที่ทีมงานที่มีสิทธิ์ "อย่างใดอย่างหนึ่ง" ก็ใช้ได้ (เช่น อัปโหลดรูป)
function requireStaff(req, res, next) {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  if (user.is_admin) return next();
  const db = readDB();
  const member = db.team.find((m) => m.discord_id === user.discord_id);
  if (member && Array.isArray(member.permissions) && member.permissions.length > 0) return next();
  return res.status(403).json({ error: "permission_denied" });
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.hasPermission = hasPermission;
module.exports.requirePermission = requirePermission;
module.exports.requireStaff = requireStaff;
