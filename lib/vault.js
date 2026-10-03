import crypto from 'crypto';
import { headers } from 'next/headers';
export const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const randomCode = (n=8) => Array.from(crypto.randomBytes(n), b => AB[b % AB.length]).join('');
export const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/;
export async function origin(){
  const h = await headers(); return `${h.get('x-forwarded-proto')||'http'}://${h.get('x-forwarded-host')||h.get('host')}`;
}
// ลิงก์รัน: https://api.flexozy.xyz/raw/CODE (ไม่มี vault ไม่มี password=)
export const apiHost = () => (process.env.API_HOST || (process.env.NODE_ENV==='production' ? 'api.flexozy.xyz' : '')).trim();
const base = (o) => apiHost() ? `https://${apiHost()}` : o;
export const rawUrl = (o, code) => `${base(o)}/raw/${code}`;
// โค้ดนับผู้เล่น: ถูกแปะหน้าสคริปต์ตอนรันผ่าน executor — ส่ง ping ทุก 45 วิ (ชื่อ/ไอดี/แมพ) กลับมาที่ API
export const tracker = (o, code) => `task.spawn(function()pcall(function()local S=game:GetService("Players")local H=game:GetService("HttpService")local L=S.LocalPlayer while not L do task.wait(.3)L=S.LocalPlayer end local g=""pcall(function()g=game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name end)while true do pcall(function()game:HttpGet("${base(o)}/ping/${code}?u="..L.UserId.."&n="..H:UrlEncode(L.Name).."&d="..H:UrlEncode(L.DisplayName).."&p="..game.PlaceId.."&g="..H:UrlEncode(g).."&t="..os.time())end)task.wait(45)end end)end)\n`;
// เบราว์เซอร์เปิดหน้าเว็บ = ไม่ให้เห็นโค้ด / executor (HttpGet) = ได้โค้ด
export function isBrowser(req){
  const h = req.headers, ua = (h.get('user-agent')||'').toLowerCase();
  if(ua.includes('roblox')) return false;
  return h.get('sec-fetch-dest')==='document' || h.get('sec-fetch-mode')==='navigate' || (h.get('accept')||'').includes('text/html');
}
export const checkPw = (v, pw) => { if(!v.hash) return true; if(!pw) return false;
  const a=Buffer.from(hash(String(pw), v.salt)), b=Buffer.from(v.hash); return a.length===b.length && crypto.timingSafeEqual(a,b); };
