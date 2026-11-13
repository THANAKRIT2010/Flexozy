import crypto from 'crypto';
import { cookies } from 'next/headers';
import { SECRET as ROOT } from './secret';
// คุกกี้เซ็นด้วย HMAC (แยกกุญแจต่อการใช้งานด้วย prefix) + มีเวลาหมดอายุอยู่ใน payload เอง (ขโมยคุกกี้ไปก็ใช้ได้ไม่เกินอายุ)
export const SECRET = ROOT;
const sign = (s) => crypto.createHmac('sha256', 'sess:' + ROOT()).update(s).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// v25.4: ถ้าตั้ง COOKIE_DOMAIN ไว้ (เช่น flexozy.xyz แบบไม่มี https:// และไม่มี app./api. นำหน้า) คุกกี้จะใช้ร่วมกันได้ทุกโดเมนย่อย
// (flexozy.xyz, app.flexozy.xyz, api.flexozy.xyz) — ไม่ตั้งค่านี้ = พฤติกรรมเดิมทุกอย่าง (คุกกี้ผูกกับโดเมนที่ตั้งเป๊ะ ๆ เท่านั้น)
// จำเป็นมากถ้าเริ่มล็อกอินที่โดเมนหนึ่งแต่ Discord redirect กลับมาอีกโดเมนหนึ่ง (เช่น app.flexozy.xyz → callback ที่ flexozy.xyz)
// ไม่งั้นคุกกี้ oauth_state จะอ่านไม่เจอฝั่ง callback → "Invalid OAuth state" ทุกครั้ง
const opts = (maxAge) => ({ httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', path:'/', maxAge, ...(process.env.COOKIE_DOMAIN ? { domain:process.env.COOKIE_DOMAIN } : {}) });
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
export async function clearCookie(name){ (await cookies()).delete(process.env.COOKIE_DOMAIN ? { name, path:'/', domain:process.env.COOKIE_DOMAIN } : name) }
