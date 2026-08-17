// controllers/upload.controller.js — รับไฟล์รูปที่แอดมินแนบจากเครื่อง แล้วคืนลิงก์ไว้ใช้ต่อ (popup / พาร์ทเนอร์ / โลโก้)
function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: "no_file" });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
}

module.exports = { uploadImage };
