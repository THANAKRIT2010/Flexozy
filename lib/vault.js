import crypto from 'crypto';
import { headers } from 'next/headers';
import { SECRET } from './session';
import { BOT_RE, forbidden } from './bots';
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
// โค้ดนับผู้เล่น: ถูกแปะหน้าสคริปต์ตอนรันผ่าน executor — ส่ง ping ทุก 10 นาที (ชื่อ/ไอดี/แมพ) — ห่าง ๆ เพื่อไม่ให้ KV เต็ม/โควตาหมด กลับมาที่ API
// ตัวตรวจจับตัวดัก/ตัวดึงซอส: รันก่อนสคริปต์จริง ถ้าเจอจะเตะผู้เล่นออกพร้อมข้อความ "404" (และเช็คซ้ำก่อน/หลังดึง payload และก่อนรัน)
// GUARD_LEVEL ใน ENV: 0 = เช็คแค่ตัวแปร/GUI ของตัวโหลดเรา | 1 = + loadstring ถูกครอบ | 2 (ค่าเริ่มต้น) = + HttpGet/pcall/string.char/table.concat/bit32.bxor ถูกฮุก + __namecall เป็น Lua
// ระดับ 2 เข้มสุดแต่เสี่ยงเตะผู้เล่นปกติที่รันสคริปต์ฮุกอื่น (remote spy, anti-kick) → ถ้ามีคนโดนเตะผิดให้ลดเป็น 1 หรือ 0 (GUARD_STRICT=0 เดิม = ระดับ 0)
const LEVEL = process.env.GUARD_LEVEL !== undefined ? Number(process.env.GUARD_LEVEL) : (process.env.GUARD_STRICT === '0' ? 0 : 2);
const L1 = `pcall(function()if islclosure and islclosure(loadstring)then bad=true end end)
pcall(function()local s=debug.info(loadstring,"s")if s and s~="[C]"then bad=true end end)
`;
const L2 = `local ih=isfunctionhooked or is_function_hooked
local function lc(f)return type(f)=="function" and islclosure and islclosure(f)end
pcall(function()for _,f in ipairs({loadstring,pcall,string.char,table.concat,bit32.bxor,game.HttpGet})do if lc(f)or(ih and ih(f))then bad=true end end end)
pcall(function()if lc(getrawmetatable(game).__namecall)then bad=true end end)
`;
const GUARD = `local __fxP=game:GetService("Players")local __fxL=__fxP.LocalPlayer while not __fxL do task.wait(.3)__fxL=__fxP.LocalPlayer end
local function __fxC()local G=(getgenv and getgenv())or _G local bad=false
pcall(function()if G.__FlexozyOldLoadstring or G.__FlexozyHttpHooked or G.__FlexozyOnHttp then bad=true end end)
local function chk(f)pcall(function()if f():FindFirstChild("FlexozyLoader")then bad=true end end)end
chk(function()return __fxL.PlayerGui end)chk(function()return game:GetService("CoreGui")end)
${LEVEL>=1 ? L1 : ''}${LEVEL>=2 ? L2 : ''}return bad end
local function __fxX()if __fxC()then pcall(function()__fxL:Kick("404")end)pcall(function()game:Shutdown()end)repeat task.wait(1)until false end end
__fxX()
`;
export const tracker = (o, code) => `${GUARD}task.spawn(function()pcall(function()local S=game:GetService("Players")local H=game:GetService("HttpService")local L=S.LocalPlayer while not L do task.wait(.3)L=S.LocalPlayer end local g=""pcall(function()g=game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name end)while true do pcall(function()game:HttpGet("${base(o)}/ping/${code}?u="..L.UserId.."&n="..H:UrlEncode(L.Name).."&d="..H:UrlEncode(L.DisplayName).."&p="..game.PlaceId.."&g="..H:UrlEncode(g).."&t="..os.time())end)task.wait(600)end end)end)\n`;
// เบราว์เซอร์เปิดหน้าเว็บ = ไม่ให้เห็นโค้ด / executor (HttpGet) = ได้โค้ด
export function isBrowser(req){
  const h = req.headers, ua = (h.get('user-agent')||'').toLowerCase();
  if(ua.includes('roblox')) return false;
  return h.get('sec-fetch-dest')==='document' || h.get('sec-fetch-mode')==='navigate' || (h.get('accept')||'').includes('text/html');
}
// AI / crawler / เครื่องมือยิง HTTP / เบราว์เซอร์ → 403 (ข้อความเดียวกันทั้งหมด), executor → null (ผ่าน)
export const isBot = (req) => BOT_RE.test(req.headers.get('user-agent')||'');
// ENV ที่ช่วยปิดช่อง "บอทแกล้งทำเป็น executor":
//   LOG_EXEC=1        → log (Vercel Logs) ทุกคำขอที่ผ่านด่านเข้า /raw /stage ด้วย UA/IP/ชื่อ header → ดูว่าบอทใช้ UA อะไร แล้วเอาไปใส่ BOT_RE
//   BLOCK_IPS=1.2.3.4,34.12.*   → IP (ตรงตัว หรือขึ้นต้นด้วยแล้วปิดท้าย *) ที่ได้ 403 ทันที (ใส่ IP ของบอทที่เห็นใน log)
//   BLOCK_UA=regex              → UA ที่ได้ 403 ทันที (เพิ่มได้โดยไม่ต้อง deploy โค้ดใหม่)
//   EXEC_UA_ALLOW=... → regex ของ UA ที่อนุญาตเท่านั้น เช่น 'roblox|wininet' (ไม่ตรง = 403) — ตั้งหลังดู log แล้ว
export function denied(req){
  if(isBot(req) || isBrowser(req)) return forbidden();
  const h = req.headers, ua = h.get('user-agent')||'', al = process.env.EXEC_UA_ALLOW, ip = (h.get('cf-connecting-ip') || (h.get('x-forwarded-for')||'').split(',')[0]).trim(); // ผ่าน Cloudflare ใช้ cf-connecting-ip
  const bi = (process.env.BLOCK_IPS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(ip && bi.some(x => x.endsWith('*') ? ip.startsWith(x.slice(0,-1)) : ip===x)) return forbidden();
  if(process.env.BLOCK_UA){ try{ if(new RegExp(process.env.BLOCK_UA,'i').test(ua)) return forbidden() }catch{} }
  if(al){ let ok=false; try{ ok = new RegExp(al,'i').test(ua) }catch{} if(!ok) return forbidden(); }
  if(process.env.LOG_EXEC==='1') console.log('[exec]', JSON.stringify({ path:new URL(req.url).pathname, ua, ip,
    accept:h.get('accept'), enc:h.get('accept-encoding'), lang:h.get('accept-language'), hdrs:[...h.keys()].sort().join(',') }));
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
  const t = makeToken(code), nonce = t.split('.')[0];
  return tracker(o, code) + `do local K="${nonce}" local A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" local m={}for i=1,64 do m[A:byte(i)]=i-1 end
local ok,s=pcall(function()return game:HttpGet("${base(o)}/stage/${code}?t=${t}")end)
__fxX()
if not ok or type(s)~="string" or #s==0 then warn("[Flexozy] 404")return end
if s:byte(1)==33 then warn("[Flexozy] "..s:sub(2))return end
local out,n,b,c,kl={},0,0,0,#K
for i=1,#s do local v=m[s:byte(i)]if v then b=bit32.bor(bit32.lshift(b,6),v)c=c+6 if c>=8 then c=c-8 local x=bit32.rshift(b,c)b=bit32.band(b,bit32.lshift(1,c)-1)n=n+1 out[n]=string.char(bit32.bxor(x,K:byte((n-1)%kl+1)))end end end
local f,e=loadstring(table.concat(out))if not f then warn("[Flexozy] "..tostring(e))return end
__fxX()f() end
`;
}
