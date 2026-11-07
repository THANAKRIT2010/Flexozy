import crypto from 'crypto';
import { SECRET } from './secret';
// ===== v11: Proof-of-Execution (พิสูจน์ว่า "รัน Lua จริง" ไม่ใช่แค่ยิง HTTP ให้หน้าตาเหมือน Roblox) =====
// ปัญหา: บอท/สคริปต์ดึงซอสทำได้เพราะ POST /auth และ GET /stage หน้าตาเหมือนที่ executor ยิง — เซิร์ฟเวอร์แยกไม่ออกว่าใครยิง
// ทางแก้: เซิร์ฟเวอร์ส่งโปรแกรม Lua สั้น ๆ ที่ "สุ่มใหม่ทุกครั้ง" (ค่าคงที่/ลำดับคำสั่ง/ชื่อตัวแปรต่างกัน) ฝังมากับ stub
//   client ต้องรันโปรแกรมนี้ในสภาพแวดล้อม Roblox (ใช้ bit32 + typeof(game) + GetService) แล้วส่งผลลัพธ์กลับมาพร้อมคำขอ
//   เซิร์ฟเวอร์คำนวณคำตอบที่ถูกจาก nonce เอง (ไม่ต้องเก็บ state) — ไม่มีคำตอบ = 403
// ข้อจำกัด (พูดตรง ๆ): ผู้โจมตีที่เขียนตัวจำลอง Lua + Roblox ครบก็ยังผ่านได้ — ชั้นนี้ฆ่า "บอทดิสคอร์ด/สคริปต์ copy-paste" ที่ไม่ได้รัน Lua
//   ไม่ใช่ของที่ทำให้ "เป็นไปไม่ได้" ส่วนที่กันได้จริงคือ key + HWID (ลิงก์/แมพที่สำคัญต้องใช้ key)
const M32 = 4294967296;
const bindIp = () => process.env.BOOT_BIND_IP !== '0';
const CH_TTL = () => Math.max(300, Number(process.env.AUTH_CHALLENGE_SEC) || 21600) * 1000; // อายุ challenge ของ /auth (ค่าเริ่มต้น 6 ชม. — hub เปิดค้างไว้ได้)
const hm = (label, data) => crypto.createHmac('sha256', label + SECRET()).update(data).digest();
const eq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };

// ตัวอ่านไบต์แบบกำหนดผลล่วงหน้าจาก nonce (HMAC counter mode)
function stream(nonce){
  let buf = Buffer.alloc(0), ctr = 0;
  const need = (n) => { while(buf.length < n){ buf = Buffer.concat([buf, hm('proof:', `${nonce}|${ctr++}`)]); } };
  return { u8(){ need(1); const v = buf[0]; buf = buf.subarray(1); return v; },
    u32(){ need(4); const v = buf.readUInt32BE(0); buf = buf.subarray(4); return v; },
    u16(){ need(2); const v = buf.readUInt16BE(0); buf = buf.subarray(2); return v; } };
}
const ID = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// สร้างโปรแกรม: ลิสต์คำสั่งบนตัวสะสม a (uint32) — ใช้ทั้งสร้างโค้ด Lua และคำนวณคำตอบ (ต้องตรงกันทุกบิต)
function ops(nonce){
  const r = stream(nonce), list = [], n = 14 + (r.u8() % 5);
  for(let i = 0; i < n; i++){
    const k = r.u8() % 6;
    if(k === 0) list.push({ k, c: r.u32() });                       // บวก (mod 2^32)
    else if(k === 1) list.push({ k, c: r.u32() });                  // xor
    else if(k === 2) list.push({ k, r: 1 + (r.u8() % 31) });        // หมุนซ้าย
    else if(k === 3) list.push({ k, c: 3 + (r.u16() % 65000) });    // คูณ (ค่าคงที่ < 2^16 → ผลคูณ < 2^48 แม่นยำใน double)
    else if(k === 4) list.push({ k, c: r.u32() });                  // xor ที่ขึ้นกับสภาพแวดล้อม Roblox (e = 1 เมื่ออยู่ใน Roblox)
    else list.push({ k, r: 1 + (r.u8() % 31) });                    // a ^= a >> r
  }
  return list;
}
export function proofExpect(nonce){
  let a = parseInt(String(nonce).slice(0, 8), 16) >>> 0;
  for(const o of ops(nonce)){
    if(o.k === 0) a = (a + o.c) >>> 0;
    else if(o.k === 1 || o.k === 4) a = (a ^ o.c) >>> 0;
    else if(o.k === 2) a = ((a << o.r) | (a >>> (32 - o.r))) >>> 0;
    else if(o.k === 3) a = (a * o.c) % M32;
    else a = (a ^ (a >>> o.r)) >>> 0;
  }
  return String(a);
}
// โค้ด Lua: local function NAME(n) ... return "<ตัวเลข>" end — ชื่อตัวแปรภายในสุ่มใหม่ทุกครั้ง
export function proofLua(nonce, fname){
  const r = stream('names|' + nonce), used = new Set(), nm = () => { let s; do { s = ID[r.u8() % 52] + ID[r.u8() % 52] + ID[r.u8() % 52]; } while(used.has(s)); used.add(s); return s; };
  const [A, E, B, N] = [nm(), nm(), nm(), nm()];
  const body = ops(nonce).map(o => {
    if(o.k === 0) return `${A}=${B}.band(${A}+${o.c},4294967295)`;
    if(o.k === 1) return `${A}=${B}.bxor(${A},${o.c})`;
    if(o.k === 2) return `${A}=${B}.lrotate(${A},${o.r})`;
    if(o.k === 3) return `${A}=(${A}*${o.c})%4294967296`;
    if(o.k === 4) return `${A}=${B}.bxor(${A},${E}*${o.c})`;
    return `${A}=${B}.bxor(${A},${B}.rshift(${A},${o.r}))`;
  }).join('\n');
  return `local function ${fname}(${N})\nlocal ${B}=bit32\nlocal ${A}=tonumber(string.sub(${N},1,8),16)\nlocal ${E}=(typeof(game)=="Instance" and game:GetService("Players").ClassName=="Players") and 1 or 0\n${body}\nreturn string.format("%d",${A})\nend\n`;
}
export const proofOk = (nonce, pf) => /^\d{1,10}$/.test(String(pf || '')) && eq(proofExpect(nonce), pf);

// ===== challenge ของ /auth: sc = nonce.exp.mac (ผูก IP) — ฝังใน FxApi ตอนเซิร์ฟเวอร์ประกอบ hub / stub ที่ต้องใช้ key =====
const scMac = (nonce, exp, ip) => hm('sc:', `${nonce}|${exp}|${bindIp() ? ip : ''}`).toString('base64url').slice(0, 22);
export function newChallenge(ip = ''){
  const nonce = crypto.randomBytes(8).toString('hex'), exp = Date.now() + CH_TTL(), sc = `${nonce}.${exp}.${scMac(nonce, exp, ip)}`;
  return { sc, nonce, lua: `local FX_SC = "${sc}"\n${proofLua(nonce, 'FX_PF')}` };
}
// คืน { ok, nonce } | { ok:false, reason:'format'|'expired'|'ip'|'proof' } (reason ใช้บันทึก log เท่านั้น ไม่ส่งให้ client)
export function checkChallenge(sc, pf, ip = ''){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([A-Za-z0-9_-]{22})$/.exec(String(sc || ''));
  if(!m) return { ok:false, reason:'format' };
  if(Number(m[2]) < Date.now()) return { ok:false, reason:'expired' };
  if(!eq(scMac(m[1], m[2], ip), m[3])) return { ok:false, reason:'ip' };
  if(!proofOk(m[1], pf)) return { ok:false, reason:'proof' };
  return { ok:true, nonce:m[1] };
}
export const proofRequired = () => process.env.AUTH_PROOF !== '0';
