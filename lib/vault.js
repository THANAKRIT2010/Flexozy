import crypto from 'crypto';
import { headers } from 'next/headers';
import { SECRET } from './session';
import { BOT_RE } from './bots';
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
// AI / crawler / เครื่องมือยิง HTTP → 404 (เหมือนไม่มีลิงก์นี้), เบราว์เซอร์ → 403, executor → null (ผ่าน)
export const isBot = (req) => BOT_RE.test(req.headers.get('user-agent')||'');
export function denied(req){
  const h = { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow, noarchive' };
  if(isBot(req)) return new Response('404', { status:404, headers:h });
  if(isBrowser(req)) return new Response('404', { status:403, headers:h });
  return null;
}
export const checkPw = (v, pw) => { if(!v.hash) return true; if(!pw) return false;
  const a=Buffer.from(hash(String(pw), v.salt)), b=Buffer.from(v.hash); return a.length===b.length && crypto.timingSafeEqual(a,b); };

// ===== ส่งแบบ 2 ขั้น (STAGED=0 ใน ENV = ปิด กลับไปส่งซอสตรง ๆ แบบเดิม) =====
// /raw/CODE ส่งแค่ stub + token (อายุ 60 วิ ใช้ได้ครั้งเดียว) → stub ไปขอ /stage/CODE → ได้สคริปต์ที่ XOR+base64 → ถอดแล้วรัน
export const staged = () => process.env.STAGED !== '0';
const mac = (code, nonce, exp) => crypto.createHmac('sha256', 'stage:'+SECRET()).update(`${code}|${nonce}|${exp}`).digest('base64url').slice(0,22);
export const makeToken = (code) => { const nonce = crypto.randomBytes(8).toString('hex'), exp = Date.now()+60000; return `${nonce}.${exp}.${mac(code,nonce,exp)}`; };
export function readToken(code, t){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([A-Za-z0-9_-]{22})$/.exec(String(t||'')); if(!m) return null;
  const [, nonce, exp, sig] = m; if(Number(exp) < Date.now()) return null;
  const a = Buffer.from(sig), b = Buffer.from(mac(code,nonce,exp));
  return a.length===b.length && crypto.timingSafeEqual(a,b) ? nonce : null;
}
export const xorB64 = (text, key) => { const buf = Buffer.from(String(text),'utf8'); for(let i=0;i<buf.length;i++) buf[i]^=key.charCodeAt(i%key.length); return buf.toString('base64url'); };
export function stagedStub(o, code){
  const t = makeToken(code), key = t.split('.')[0];
  return tracker(o, code) + `do local K="${key}" local A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" local m={}for i=1,64 do m[A:byte(i)]=i-1 end
local ok,s=pcall(function()return game:HttpGet("${base(o)}/stage/${code}?t=${t}")end)
if not ok or type(s)~="string" or #s==0 then warn("[Flexozy] 404")return end
local out,n,b,c,kl={},0,0,0,#K
for i=1,#s do local v=m[s:byte(i)]if v then b=bit32.bor(bit32.lshift(b,6),v)c=c+6 if c>=8 then c=c-8 local x=bit32.rshift(b,c)b=bit32.band(b,bit32.lshift(1,c)-1)n=n+1 out[n]=string.char(bit32.bxor(x,K:byte((n-1)%kl+1)))end end end
local f,e=loadstring(table.concat(out))if not f then warn("[Flexozy] "..tostring(e))return end
f() end
`;
}
