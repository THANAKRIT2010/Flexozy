// lib/limits.ts — โควตา rate limit ทั้งหมดอยู่ที่นี่ที่เดียว (ต่อ 1 IP) ปรับได้ง่าย
// ตอนโดนโจมตีหนัก ตั้ง env RL_SCALE=0.5 เพื่อเข้มขึ้นเท่าตัวทุกเส้นทางโดยไม่ต้องแก้โค้ด
import { RL_SCALE } from "./env";

export type Rule = { name: string; max: number; windowSec: number };

const r = (name: string, max: number, windowSec: number): Rule => ({
  name,
  max: Math.max(1, Math.round(max * RL_SCALE)),
  windowSec,
});

export const LIMITS = {
  page: r("page", 120, 60), // เปิดหน้าเว็บ
  api: r("api", 90, 60), // API ทั่วไป
  verify: r("verify", 8, 300), // ส่ง captcha (กันยิงเดา/วนยืนยัน)
  robloxCheck: r("rbx-check", 20, 60), // เช็ค Roblox ID (ต้องไปถาม Roblox จริง)
  robloxAudio: r("rbx-audio", 40, 60), // ขอไฟล์เสียง
  raw: r("raw", 60, 60), // ลิงก์ loadstring ต่อ IP
  rawPerCode: r("raw-code", 40, 60), // ลิงก์ loadstring ต่อ IP ต่อโค้ด
  write: r("write", 20, 60), // POST/PUT/DELETE ทั่วไป
  vaultCreate: r("vault-create", 10, 3600), // สร้าง vault ต่อผู้ใช้ต่อชั่วโมง
  unlockFail: r("unlock-fail", 8, 300), // ใส่รหัส vault ผิด (ต่อ IP+โค้ด)
  audioDownload: r("audio-dl", 6, 600), // ดาวน์โหลดไฟล์เสียงใหม่จาก Roblox (ต่อ IP)
  login: r("login", 15, 300), // เริ่ม OAuth
} as const;

// เพดานรวมทั้งระบบ ที่ยิงไปหา Roblox (ป้องกันไม่ให้ Roblox ลิมิต IP เซิร์ฟเวอร์เรา)
export const ROBLOX_UPSTREAM_BUDGET = { max: 40, windowSec: 10 };
