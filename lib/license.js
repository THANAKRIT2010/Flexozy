import crypto from 'crypto';
// ระบบคีย์ผูกอุปกรณ์ + ลายน้ำต่อการส่ง (ฝั่งเซิร์ฟเวอร์ล้วน ทดสอบแยกได้)
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const hk = (k) => sha(k);                       // เก็บเฉพาะ hash ของคีย์ (คีย์จริงโชว์ครั้งเดียวตอนสร้าง)
export const newKey = () => { const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b=crypto.randomBytes(24); let s=''; for(const x of b) s+=A[x%32]; return 'FX-'+s.match(/.{4}/g).join('-'); };
export const newKeyId = () => crypto.randomBytes(5).toString('hex');
// ตรวจคีย์ + ผูกอุปกรณ์ (เกินจำนวนเครื่องที่กำหนด = ปฏิเสธ) คืน {ok, entry} หรือ {ok:false, reason:'key'|'device'}
export function checkKey(v, key, hwid, userId){
  const e = (v.keys||[]).find(x => x.h === hk(key));
  if(!e || e.revoked || (e.exp && e.exp < Date.now())) return { ok:false, reason:'key' };
  const d = sha(`${v.code}|${hwid}`).slice(0,24);
  e.devs ||= []; let dev = e.devs.find(x => x.d === d);
  if(!dev){ if(e.devs.length >= (e.max||1)) return { ok:false, reason:'device' }; dev = { d, t:Date.now() }; e.devs.push(dev); }
  dev.l = Date.now(); if(userId) dev.u = userId; e.uses = (e.uses||0)+1; e.last = Date.now();
  return { ok:true, entry:e };
}
export function logDelivery(v, rec){ (v.log ||= []).push(rec); if(v.log.length > 200) v.log.splice(0, v.log.length-200); }
// ลายน้ำ: รหัสเฉพาะการส่งครั้งนั้น (= nonce ในบันทึก v.log) ฝังเป็นโค้ดที่ต้นสคริปต์ + คอมเมนต์ท้ายสคริปต์ → ถ้าซอสหลุดและยังมีรหัสนี้อยู่ รู้ว่าหลุดจากคีย์/เครื่อง/ผู้เล่นไหน
export const watermark = (script, id) => `do local _="wm:${id}"end\n${script}\n--[[wm:${id}]]`;
