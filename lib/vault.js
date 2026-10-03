import crypto from 'crypto';
import { headers } from 'next/headers';
export const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
export const checkPw = (v, pw) => { if(!v.hash) return true; if(!pw) return false;
  const a=Buffer.from(hash(String(pw), v.salt)), b=Buffer.from(v.hash); return a.length===b.length && crypto.timingSafeEqual(a,b); };
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const randomCode = (n=8) => Array.from(crypto.randomBytes(n), b => AB[b % AB.length]).join(''); // คนทั่วไป: สุ่มตัวอักษร
export const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/; // แอดมินตั้งเอง: 4–40 ตัว
export async function origin(){
  const h = await headers(); return `${h.get('x-forwarded-proto')||'http'}://${h.get('x-forwarded-host')||h.get('host')}`;
}
// ลิงก์รัน: https://api.flexozy.xyz/CODE (ไม่มี /raw/vault ไม่มี ?password=)
export const rawUrl = (o, code) => process.env.API_HOST ? `https://${process.env.API_HOST}/${code}` : `${o}/raw/vault/${code}`;
