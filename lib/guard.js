// lib/guard.js — ระบบกันฝั่งเซิร์ฟเวอร์ (พอร์ตจากแนวคิดของ getkey-guard.js)
// หลักการเดียวกับโค้ดตัวอย่าง: token ผูก IP+UA · ใช้ได้ครั้งเดียว · จำกัดความถี่ต่อ IP · จำกัดคีย์ต่อ IP ต่อวัน · โดนปฏิเสธซ้ำ = แบนชั่วคราว
// ต่างจากตัวอย่าง 1 จุด: ใช้ db.js (KV/ไฟล์) แทน Map ในหน่วยความจำ เพราะบน Vercel แต่ละคำขออาจไปคนละ instance
// ไม่มีโค้ดฝั่งเกม (Lua) และไม่เตะผู้เล่น — ปฏิเสธด้วย HTTP 403/404 เท่านั้น
import crypto from 'crypto';
import { hit, flag, isFlagged, logSec } from './db';
import { clientIp } from './net';
import { forbidden } from './bots';
import { notFound } from './http';

const num = (name, def, min = 1) => { const n = Number(process.env[name]); return Number.isFinite(n) && n >= min ? Math.floor(n) : def; };
export const CFG = {
  keysPerDay: () => num('AUTO_KEY_PER_DAY', 3),      // = maxKeysPerDay ในตัวอย่าง: คีย์ใหม่ต่อ IP ต่อ 24 ชม.
  strikeMax:  () => num('STRIKE_MAX', 8),             // โดนปฏิเสธเพราะ token/proof ผิดกี่ครั้งใน 10 นาที ถึงถูกแบน
  banSec:     () => num('LOADER_BAN_SEC', 900, 60),   // แบนกี่วินาที (ใช้ค่าเดียวกับระบบเดิม)
  bindUa:     () => process.env.TOKEN_BIND_UA !== '0',// token ผูก User-Agent ด้วย (0 = ปิด)
};

export const ipOf = (req) => clientIp(req) || 'local';
export const uaOf = (req) => crypto.createHash('sha256').update(String(req.headers.get('user-agent') || '')).digest('hex').slice(0, 16);
// ค่าที่ใส่ใน mac ของ token: ถ้าปิดผูก UA ให้เป็นค่าว่าง (token เดิมที่ออกก่อนอัปเดตจะหมดอายุเองใน 1-2 นาที)
export const uaBind = (req) => CFG.bindUa() ? uaOf(req) : '';

// ตอบปฏิเสธ: 403 ข้อความเดียวกันทั้งระบบ / 404 สำหรับของที่ "ไม่มีอยู่"
export const refuse403 = forbidden;
export const refuse404 = notFound;

export async function banned(req){ return isFlagged('ban:' + ipOf(req)); }

// นับการถูกปฏิเสธ (= onLog ในตัวอย่าง) — ครบเกณฑ์ → แบน IP ชั่วคราว ทุก endpoint ของ executor จะตอบ 403
export async function strike(req, event, info = ''){
  const ip = ipOf(req);
  await logSec(event, ip, info);
  const n = await hit('strike:' + ip, 600);
  if(n >= CFG.strikeMax()){ await flag('ban:' + ip, CFG.banSec()); await logSec('auto_ban', ip, `โดนปฏิเสธ ${n} ครั้งใน 10 นาที`); }
  return n;
}

// เพดานการออกคีย์ใหม่ต่อ IP ต่อ 24 ชม. (= maxKeysPerDay) — เรียกเฉพาะตอนจะ "สร้างคีย์ใหม่" จริง ๆ
export async function keyDayExceeded(ip){ return (await hit('keyday:' + ip, 86400)) > CFG.keysPerDay(); }
