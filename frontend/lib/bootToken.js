import crypto from 'crypto';
import { SECRET } from './secret';
// token ของ /bootstrap-source: /loader ออกให้ตอนส่ง stub (อายุ 2 นาที ใช้ได้ครั้งเดียว)
// v14: ผูก User-Agent ด้วย (TOKEN_BIND_UA=0 เพื่อปิด) — /loader กับ /bootstrap-source เรียกผ่าน HttpGet เหมือนกัน UA จึงตรงกันเสมอ
// v10: ผูกกับ IP ของผู้ขอ — ถ้ามีคน dump stub แล้วเอา token ไปใช้จากเครื่อง/IP อื่น จะไม่ผ่าน (BOOT_BIND_IP=0 เพื่อปิดการผูก IP)
const bind = () => process.env.BOOT_BIND_IP !== '0';
const mac = (nonce, exp, ip, ua) => crypto.createHmac('sha256', 'boot:' + SECRET()).update(`${nonce}|${exp}|${bind() ? ip : ''}|${ua}`).digest('base64url').slice(0, 22);
export function makeBootToken(ip = '', ua = ''){ const nonce = crypto.randomBytes(8).toString('hex'), exp = Date.now() + 120000; return `${nonce}.${exp}.${mac(nonce, exp, ip, ua)}`; }
// คืน { nonce } เมื่อถูกต้อง | { nonce:null, reason:'format'|'expired'|'ip' } เมื่อไม่ผ่าน (reason ใช้บันทึก log เท่านั้น ไม่ส่งให้ client)
export function readBootToken(t, ip = '', ua = ''){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([A-Za-z0-9_-]{22})$/.exec(String(t||'')); if(!m) return { nonce:null, reason:'format' };
  if(Number(m[2]) < Date.now()) return { nonce:null, reason:'expired' };
  const a = Buffer.from(m[3]), b = Buffer.from(mac(m[1], m[2], ip, ua));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? { nonce:m[1] } : { nonce:null, reason:'ip' };
}
