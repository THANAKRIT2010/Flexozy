import crypto from 'crypto';
import { cookies } from 'next/headers';
// ห้ามใช้ค่าเดาได้บน production: ถ้าไม่ได้ตั้ง SESSION_SECRET ให้ใช้ DISCORD_CLIENT_SECRET แทน (ควรตั้ง SESSION_SECRET เองอยู่ดี)
const RANDOM = crypto.randomBytes(32).toString('hex');
export const SECRET = () => process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET || (process.env.NODE_ENV==='production' ? RANDOM : 'dev_secret_change_me');
const sign = (s) => crypto.createHmac('sha256', SECRET()).update(s).digest('base64url');
const opts = (maxAge) => ({ httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', path:'/', maxAge });
export const ADMIN_IDS = () => (process.env.ADMIN_DISCORD_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
export async function setCookie(name, obj, maxAge){
  const p = Buffer.from(JSON.stringify(obj)).toString('base64url');
  (await cookies()).set(name, `${p}.${sign(p)}`, opts(maxAge));
}
export async function readCookie(name){
  const v = (await cookies()).get(name)?.value; if(!v) return null;
  const [p, s] = v.split('.'); if(!p || !s || sign(p) !== s) return null;
  try{ return JSON.parse(Buffer.from(p,'base64url').toString()) }catch{ return null }
}
export async function getUser(){
  const u = await readCookie('session'); if(!u) return null;
  return { ...u, is_admin: ADMIN_IDS().includes(u.id) }; // เช็คสิทธิ์แอดมินสดจาก ENV ทุกครั้ง
}
export const setUser = (u) => setCookie('session', u, 7*86400);
export async function clearCookie(name){ (await cookies()).delete(name) }
