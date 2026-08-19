// app.js — ประกอบ Express app ทั้งหมด (middleware + routes) แยกจาก server.js เพื่อให้ test ได้ง่าย
require("express-async-errors"); // patch express ให้ error จาก async route handler ที่ throw ถูกส่งเข้า error handler อัตโนมัติ (ไม่งั้น process จะค้าง/ล่ม)
const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session"); // เก็บ session ไว้ใน cookie ที่เข้ารหัสแล้วโดยตรง แทนการเก็บในหน่วยความจำเซิร์ฟเวอร์
const cors = require("cors");
const { SESSION_SECRET, FRONTEND_URL, NODE_ENV } = require("./config/env");
const { trackSession } = require("./middleware/onlineTracker");
const { trackLastSeen } = require("./middleware/lastSeen");
const { enforceBan } = require("./middleware/enforceBan");
const { trackDailyVisit } = require("./middleware/dailyStats");
const routes = require("./routes");

const app = express();

// Wispbyte/Wisp.uno และ Vercel รันหลัง reverse proxy (HTTPS ภายนอก -> HTTP ภายใน)
// ต้องตั้ง trust proxy เพื่อให้ req.secure / req.protocol อ่านค่าถูกต้อง
// และให้ cookie แบบ secure ทำงานได้เมื่อรันจริงบน production
app.set("trust proxy", 1);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
// ใช้ __dirname กัน static path ผิดเพี้ยนตอนรันจาก working directory อื่น (เช่นบน Wispbyte)
app.use(express.static(path.join(__dirname, "public"))); // frontend (index.html, notify-standalone.js) อยู่ใน /public

// *** สำคัญ: ย้ายจาก express-session (MemoryStore) มาเป็น cookie-session ***
// เหตุผล: บน Vercel serverless แต่ละ request อาจถูกรันบน instance คนละตัวกัน ทำให้ session
// ที่เก็บไว้ในหน่วยความจำของ instance เดิมหายไป (login ไม่ติด/state หาย) cookie-session แก้ปัญหานี้
// โดยเก็บข้อมูล session ทั้งหมดไว้ในตัวคุกกี้เอง (เซ็นด้วย SESSION_SECRET กันปลอมแปลง) ไม่ต้องพึ่ง storage ฝั่งเซิร์ฟเวอร์เลย
app.use(
  cookieSession({
    name: "session",
    keys: [SESSION_SECRET],
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 วัน
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production", // เปิด secure cookie อัตโนมัติเมื่อรันบน HTTPS จริง (production)
  })
);

// cookie-session ไม่มี req.sessionID ให้ในตัว (ต่างจาก express-session) — เติมให้เองแบบง่ายๆ
// เพื่อให้ middleware/onlineTracker.js (นับผู้ใช้ออนไลน์) ยังทำงานได้เหมือนเดิมโดยไม่ต้องแก้ไฟล์นั้น
app.use((req, res, next) => {
  if (req.session && !req.session._sid) {
    req.session._sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  req.sessionID = req.session?._sid;
  next();
});

app.use(trackSession);
app.use(trackLastSeen);
app.use(enforceBan);
app.use(trackDailyVisit);
app.use(routes);

// SPA fallback — เว็บนี้เป็น single-page app มี client-side route เช่น /vault/:code, /team, /admin
// ถ้า path ไม่ใช่ /api, /login, /callback, /logout ให้ส่ง index.html กลับไปเสมอ
// (กัน error ตอนกด refresh หรือแชร์ลิงก์ตรงไปหน้าเหล่านี้)
app.get(/^(?!\/api\/|\/login\/|\/callback\/|\/logout).*/, (req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler สำหรับ API ที่ไม่มีจริง (ช่วย debug route ผิด path)
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// error handler กลาง — ดัก error ที่หลุดมาจาก route/middleware ใดๆ (รวมถึง async ที่ throw ผ่าน express-async-errors)
// กันไม่ให้ process ล่มเงียบๆ และส่ง response กลับไปให้ client รู้ว่าเกิดอะไรขึ้นแทนที่จะค้าง
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "internal_error", message: NODE_ENV === "production" ? undefined : err.message });
});

module.exports = app;
