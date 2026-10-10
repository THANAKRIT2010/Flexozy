import crypto from 'crypto';
import { SECRET } from './secret';
// token ของ /bootstrap-source: /loader ออกให้ตอนส่ง stub (อายุ 2 นาที ใช้ได้ครั้งเดียว) — เรียก /bootstrap-source ตรง ๆ โดยไม่ผ่าน /loader จะไม่ได้อะไร
const mac = (nonce, exp) => crypto.createHmac('sha256', 'boot:' + SECRET()).update(`${nonce}|${exp}`).digest('base64url').slice(0, 22);
export function makeBootToken(){ const nonce = crypto.randomBytes(8).toString('hex'), exp = Date.now() + 120000; return `${nonce}.${exp}.${mac(nonce, exp)}`; }
export function readBootToken(t){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([A-Za-z0-9_-]{22})$/.exec(String(t||'')); if(!m || Number(m[2]) < Date.now()) return null;
  const a = Buffer.from(m[3]), b = Buffer.from(mac(m[1], m[2]));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? m[1] : null;
}
