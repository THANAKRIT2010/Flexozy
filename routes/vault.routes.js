// routes/vault.routes.js
const express = require("express");
const router = express.Router();
const vaultController = require("../controllers/vault.controller");
const { requireAuth, requirePermission } = require("../middleware/requireAuth");

router.post("/api/vault", requireAuth, vaultController.createVaultLink);
router.get("/api/vault/mine", requireAuth, vaultController.listMine);
router.get("/api/vault", requirePermission("vault"), vaultController.listAll);

router.get("/api/vault/:code/meta", vaultController.getMeta);
router.post("/api/vault/:code/unlock", vaultController.unlock);
router.get("/api/vault/:code/admin-view", requireAuth, vaultController.adminView);
router.put("/api/vault/:code", requireAuth, vaultController.updateVaultLink);
router.delete("/api/vault/:code", requireAuth, vaultController.removeVaultLink);

// เส้นทาง raw จริงบนเซิร์ฟเวอร์ (ไม่ใช่ #hash) ใช้กับ loadstring(game:HttpGet(...)) ได้โดยตรง
// ใช้ prefix "/s/" สั้นๆ กันชนกับ path อื่นในอนาคต (ไม่ใช้ path เดี่ยวๆ อย่าง "/:code" ที่ root
// เพราะจะเสี่ยงชนกับ route จริงหรือไฟล์ static ที่เพิ่มเข้ามาทีหลัง)
router.get("/s/:code", vaultController.rawView);
// คงเส้นทางเดิมไว้เพื่อ backward compat — ลิงก์เก่าที่มีคนฝังไว้ใน loadstring(game:HttpGet(...))
// ในเกมไปแล้วจะยังใช้งานได้ปกติ ไม่พังทันทีตอน deploy
router.get("/raw/vault/:code", vaultController.rawView);

module.exports = router;
