// controllers/upload.controller.js — รับไฟล์รูปที่แอดมินแนบจากเครื่อง แล้วคืนลิงก์ไว้ใช้ต่อ (popup / พาร์ทเนอร์ / โลโก้)
const path = require("path");

// *** สำคัญ: รองรับ 2 ทางตามสภาพแวดล้อมที่รัน ***
// - บน Vercel: อัปโหลดไปที่ Vercel Blob (ต้องเปิดใช้งานก่อน: โปรเจกต์บน vercel.com → Storage → Create Database → Blob
//   จากนั้น Vercel จะผูก env var BLOB_READ_WRITE_TOKEN ให้อัตโนมัติ ไม่ต้องตั้งเอง)
// - บนเครื่อง dev / Wispbyte (ไม่มี BLOB_READ_WRITE_TOKEN): เขียนไฟล์ลง public/uploads เหมือนเดิม
async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: "no_file" });

  const ext = path.extname(req.file.originalname).toLowerCase() || ".png";
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : ".png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // ทางฝั่ง Vercel — เก็บไฟล์ถาวรบน Vercel Blob (ไม่หายตอน cold start เหมือน /tmp)
    const { put } = require("@vercel/blob");
    const blob = await put(`uploads/${filename}`, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });
    return res.status(201).json({ url: blob.url });
  }

  // ทางฝั่ง dev เครื่อง / Wispbyte — เขียนไฟล์ลงดิสก์ตรงๆ เหมือนของเดิม
  const fs = require("fs");
  const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
  return res.status(201).json({ url: `/uploads/${filename}` });
}

module.exports = { uploadImage };
