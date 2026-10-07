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
// ตัวตรวจจับตัวดัก/ตัวดึงซอส: รันก่อนสคริปต์จริง ถ้าเจอจะเตะผู้เล่นออกพร้อมข้อความ "404"
// GUARD_STRICT=0 ใน ENV = ปิดการเช็ค closure (ใช้ถ้าผู้เล่นปกติบาง executor โดนเตะผิด)
const STRICT = process.env.GUARD_STRICT !== '0';
const GUARD = `do local P=game:GetService("Players")local L=P.LocalPlayer while not L do task.wait(.3)L=P.LocalPlayer end
local G=(getgenv and getgenv())or _G local bad=false
pcall(function()if G.__FlexozyOldLoadstring or G.__FlexozyHttpHooked or G.__FlexozyOnHttp then bad=true end end)
local function chk(f)pcall(function()if f():FindFirstChild("FlexozyLoader")then bad=true end end)end
chk(function()return L.PlayerGui end)chk(function()return game:GetService("CoreGui")end)
${STRICT ? `pcall(function()if islclosure and islclosure(loadstring)then bad=true end end)
pcall(function()local s=debug.info(loadstring,"s")if s and s~="[C]"then bad=true end end)` : ''}
if bad then pcall(function()L:Kick("404")end)pcall(function()game:Shutdown()end)repeat task.wait(1)until false end end
`;
export const tracker = (o, code) => `${GUARD}task.spawn(function()pcall(function()local S=game:GetService("Players")local H=game:GetService("HttpService")local L=S.LocalPlayer while not L do task.wait(.3)L=S.LocalPlayer end local g=""pcall(function()g=game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name end)while true do pcall(function()game:HttpGet("${base(o)}/ping/${code}?u="..L.UserId.."&n="..H:UrlEncode(L.Name).."&d="..H:UrlEncode(L.DisplayName).."&p="..game.PlaceId.."&g="..H:UrlEncode(g).."&t="..os.time())end)task.wait(45)end end)end)\n`;
// เบราว์เซอร์เปิดหน้าเว็บ = ไม่ให้เห็นโค้ด / executor (HttpGet) = ได้โค้ด
export function isBrowser(req){
  const h = req.headers, ua = (h.get('user-agent')||'').toLowerCase();
  if(ua.includes('roblox')) return false;
  return h.get('sec-fetch-dest')==='document' || h.get('sec-fetch-mode')==='navigate' || (h.get('accept')||'').includes('text/html');
}
export const checkPw = (v, pw) => { if(!v.hash) return true; if(!pw) return false;
  const a=Buffer.from(hash(String(pw), v.salt)), b=Buffer.from(v.hash); return a.length===b.length && crypto.timingSafeEqual(a,b); };
