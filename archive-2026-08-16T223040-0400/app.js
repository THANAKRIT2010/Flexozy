// app.js — ประกอบ Express app ทั้งหมด (middleware + routes) แยกจาก server.js เพื่อให้ test ได้ง่าย
const path = require("path");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { SESSION_SECRET, FRONTEND_URL, NODE_ENV } = require("./config/env");
const { trackSession } = require("./middleware/onlineTracker");
const { trackLastSeen } = require("./middleware/lastSeen");
const { enforceBan } = require("./middleware/enforceBan");
const { trackDailyVisit } = require("./middleware/dailyStats");
const routes = require("./routes");

const app = express();

// Wispbyte/Wisp.uno รันหลัง reverse proxy (HTTPS ภายนอก -> HTTP ภายใน)
// ต้องตั้ง trust proxy เพื่อให้ req.secure / req.protocol อ่านค่าถูกต้อง
// และให้ cookie แบบ secure ทำงานได้เมื่อรันจริงบน production
app.set("trust proxy", 1);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
// ใช้ __dirname กัน static path ผิดเพี้ยนตอนรันจาก working directory อื่น (เช่นบน Wispbyte)
app.use(express.static(path.join(__dirname, "public"))); // frontend (index.html, notify-standalone.js) อยู่ใน /public

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 วัน
      sameSite: "lax",
      secure: NODE_ENV === "production", // เปิด secure cookie อัตโนมัติเมื่อรันบน HTTPS จริง (production)
    },
  })
);

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

module.exports = app;
