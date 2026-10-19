import crypto from 'crypto';
import { cookies } from 'next/headers';
import { SECRET as ROOT } from './secret';
// คุกกี้เซ็นด้วย HMAC (แยกกุญแจต่อการใช้งานด้วย prefix) + มีเวลาหมดอายุอยู่ใน payload เอง (ขโมยคุกกี้ไปก็ใช้ได้ไม่เกินอายุ)
export const SECRET = ROOT;
const sign = (s) => crypto.createHmac('sha256', 'sess:' + ROOT()).update(s).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const opts = (maxAge) => ({ httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', path:'/', maxAge });
export const ADMIN_IDS = () => (process.env.ADMIN_DISCORD_IDS||'').split(',').map(s=>s.trim()).filter(s => /^\d{5,25}$/.test(s));
export async function setCookie(name, obj, maxAge){
  const p = Buffer.from(JSON.stringify({ ...obj, exp: Date.now() + maxAge*1000 })).toString('base64url');
  (await cookies()).set(name, `${p}.${sign(p)}`, opts(maxAge));
}
export async function readCookie(name){
  const v = (await cookies()).get(name)?.value; if(!v || v.length > 4096) return null;
  const [p, s] = v.split('.'); if(!p || !s || !same(sign(p), s)) return null;
  try{ const o = JSON.parse(Buffer.from(p,'base64url').toString()); return o && o.exp > Date.now() ? o : null }catch{ return null }
}
export async function getUser(){
  const u = await readCookie('session'); if(!u || !/^\d{5,25}$/.test(String(u.id))) return null;
  return { id:u.id, username:String(u.username||'').slice(0,64), avatar:/^https:\/\/cdn\.discordapp\.com\//.test(u.avatar||'') ? u.avatar : '',
    is_admin: ADMIN_IDS().includes(u.id) }; // เช็คสิทธิ์แอดมินสดจาก ENV ทุกครั้ง
}
export const setUser = (u) => setCookie('session', u, 7*86400);
export async function clearCookie(name){ (await cookies()).delete(name) }
