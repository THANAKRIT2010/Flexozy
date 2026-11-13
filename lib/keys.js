import crypto from 'crypto';
import { SECRET } from './secret';
import { keyDayExceeded } from './guard';
import { getKey, saveKey, getKeyUse, saveKeyUse, claimHwid, getAutoKey, setAutoKey, getDiscordKey, setDiscordKey } from './db';
// ระบบ key: key ผูก HWID เครื่องแรก → /auth ออก token (60 วิ ใช้ครั้งเดียว ผูกกับ key+scope) → ใช้ token ดึงซอสจาก /stage หรือ /game-script
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const kidOf = (key) => sha('key:' + key).slice(0, 24);
export const hwHash = (hw) => sha('hw:' + hw).slice(0, 32);
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// สุ่มแบบไม่มี modulo bias (32 ตัวอักษร พอดี 256/8)
export const newKey = () => 'FX-' + [0,1,2,3].map(() => Array.from(crypto.randomBytes(4), b => AB[b & 31]).join('')).join('-');
export const KEY_RE = /^FX-[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/;
export const SCOPE_RE = /^(login|v:[A-Za-z0-9][A-Za-z0-9_-]{3,39}|hub:[a-z0-9][a-z0-9-]{0,39})$/;
// scope ที่ key อนุญาต: '*' = ทั้งหมด | 'hub' = เข้า hub + เกมทั้งหมดของ hub | 'login' = แค่เข้า hub | 'v:CODE' / 'hub:ID' ตรงตัว
const scopeOk = (k, scope) => (k.scopes || ['*']).some(s => s === '*' || s === scope || (s === 'hub' && (scope === 'login' || scope.startsWith('hub:'))));

export async function createKey({ label, days, scopes }){
  const key = newKey(), kid = kidOf(key);
  const rec = { kid, hint: 'FX-…' + key.slice(-4), label: String(label||'').replace(/[\u0000-\u001f<>]/g,'').slice(0, 60), created_at: Date.now(),
    exp: days > 0 ? Date.now() + Math.min(days, 3650) * 86400e3 : null, revoked: false, scopes: scopes?.length ? scopes : ['*'] };
  await saveKey(rec); return { key, rec };
}
// HWID ปลอม/ว่าง (เช่น "unknown", ตัวอักษรซ้ำ) ไม่รับ — ต้องเป็นค่าจริงจากเครื่อง
const BAD_HW = /^(unknown|none|null|nil|n\/a|na|undefined|default|0+|1+|test|hwid|fake)$/i;
export const hwidOk = (hw) => typeof hw === 'string' && hw.length >= 8 && hw.length <= 256 && !/[\u0000-\u001f<>]/.test(hw) && !BAD_HW.test(hw.trim()) && new Set(hw).size > 3;
export const keyUsable = (k, scope) => !!k && !k.revoked && !(k.exp && Date.now() > k.exp) && scopeOk(k, scope);

// ===== /auth =====
export async function authorize(key, hwid, scope, ip, who = {}){
  if(!KEY_RE.test(key) || !SCOPE_RE.test(scope) || !hwidOk(hwid)) return { err: KEY_RE.test(key) && SCOPE_RE.test(scope) ? 'bad_hwid' : 'invalid_key' };
  const kid = kidOf(key), k = await getKey(kid);
  if(!keyUsable(k, scope)) return { err: k && !k.revoked && !(k.exp && Date.now() > k.exp) && !scopeOk(k, scope) ? 'scope' : 'invalid_key' };
  const u = await getKeyUse(kid), hh = hwHash(hwid), now = Date.now();
  const ev = (t) => { u.events = [{ t, ts: now, ip, hw: hh.slice(0, 8), scope }, ...(u.events||[])].slice(0, 30); };
  // ผูก HWID แบบ atomic (HSETNX) — สองเครื่องยิงพร้อมกัน มีได้แค่เครื่องเดียวที่ผูกสำเร็จ; ข้อมูลเก่าที่เก็บ hwid ใน keyuse ยังใช้ได้
  const bound = u.hwid || await claimHwid(kid, hh);
  if(bound !== hh){ ev('hwid_mismatch'); u.denied = (u.denied||0) + 1; await saveKeyUse(kid, u); return { err:'hwid_mismatch' }; }
  if(!u.hwid){ u.hwid = hh; ev('bind'); }
  u.hw_raw = String(hwid).trim().slice(0, 256); u.hw_src = /^[a-z_]{1,24}$/.test(String(who.hws||'')) ? String(who.hws) : ''; // HWID จริง (ให้แอดมินดู) — ผูกสิทธิ์ด้วย hash เหมือนเดิม
  u.uses = (u.uses||0) + 1; u.last_used = now; u.last_ip = ip;
  // โปรไฟล์ Roblox ที่ใช้ key นี้ (ส่งมาจากสคริปต์ใน Hub) + จำนวนครั้งที่ "รันสคริปต์" (นับเฉพาะ scope hub:ID / v:CODE ไม่นับการเข้า Hub)
  const uid = /^\d{1,16}$/.test(String(who.uid||'')) && Number(who.uid) > 0 ? String(who.uid) : '', un = /^[A-Za-z0-9_]{1,40}$/.test(String(who.un||'')) ? String(who.un) : '';
  const dn = String(who.dn||'').replace(/[\u0000-\u001f<>]/g, '').slice(0, 40);
  if(uid){ u.roblox_id = uid; u.roblox_name = un || u.roblox_name || ''; u.roblox_dn = dn || u.roblox_dn || '';
    // เก็บทุกโปรไฟล์ที่เคยใช้ key นี้ (สูงสุด 5 บัญชี ล่าสุดก่อน)
    u.profiles = [{ id:uid, name:un || '', dn, ts:now }, ...(u.profiles||[]).filter(p => p.id !== uid)].slice(0, 5); }
  if(scope !== 'login') u.runs = (u.runs||0) + 1; if(u.events?.[0]?.t !== 'bind') ev('auth');
  await saveKeyUse(kid, u);
  return { token: makeKeyToken(scope, kid), runs: u.runs||0, uses: u.uses };
}

// ===== token: nonce.exp.kid.mac (ผูกกับ scope — เอาไปใช้กับลิงก์/เกมอื่นไม่ได้) =====
const mac = (scope, kid, nonce, exp) => crypto.createHmac('sha256', 'kt:' + SECRET()).update(`${scope}|${kid}|${nonce}|${exp}`).digest('base64url').slice(0, 22);
export function makeKeyToken(scope, kid){ const nonce = crypto.randomBytes(8).toString('hex'), exp = Date.now() + 60000; return `${nonce}.${exp}.${kid}.${mac(scope, kid, nonce, exp)}`; }
export function readKeyToken(scope, t){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([0-9a-f]{24})\.([A-Za-z0-9_-]{22})$/.exec(String(t||'')); if(!m) return null;
  const [, nonce, exp, kid, sig] = m; if(Number(exp) < Date.now()) return null;
  const a = Buffer.from(sig), b = Buffer.from(mac(scope, kid, nonce, exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? { nonce, kid } : null;
}
// เช็คซ้ำตอนดึงซอส: key ยังไม่ถูกเพิกถอน/หมดอายุ
export const keyStillValid = async (kid, scope) => keyUsable(await getKey(kid), scope);

// ===== ออกคีย์อัตโนมัติ (AUTO_KEY=0 เพื่อปิด) — 1 เครื่อง (HWID) ต่อ 1 คีย์; หมดอายุ/ถูกลบแล้วถึงออกใหม่; เพิกถอนแล้วไม่ออกใหม่ =====
export const autoKeyOn = () => process.env.AUTO_KEY !== '0';
export const autoKeyDays = () => { const d = Number(process.env.AUTO_KEY_DAYS); return Number.isFinite(d) && d >= 0 ? Math.min(d, 3650) : 1; };
// คืน { key } | { err }  — เรียกเฉพาะหลังตรวจ hwidOk และ rate limit แล้ว
export async function autoKeyFor(hwid, ip = ''){
  const hh = hwHash(hwid), old = await getAutoKey(hh);
  if(typeof old === 'string' && KEY_RE.test(old)){
    const k = await getKey(kidOf(old));
    if(k && k.revoked) return { err:'invalid_key' };          // แอดมินเพิกถอนแล้ว = ไม่ต่ออายุให้เอง
    if(k && !(k.exp && Date.now() > k.exp)) return { key:old }; // ยังใช้ได้ → ส่งคีย์เดิม
  }
  if(ip && await keyDayExceeded(ip)) return { err:'daily_limit' }; // เกินโควตาคีย์ใหม่ต่อ IP ต่อวัน (AUTO_KEY_PER_DAY, ค่าเริ่มต้น 3)
  const { key } = await createKey({ label:'auto', days:autoKeyDays(), scopes:['*'] });
  await setAutoKey(hh, key);
  return { key };
}

// ===== คีย์ที่ออกให้หลัง "ติดตาม YouTube + เข้าร่วม Discord" (v25.3) — คนละชุดกับ autoKeyFor ด้านบนซึ่งผูกกับ HWID =====
// ไม่ออกให้อัตโนมัติตอนล็อกอินอีกต่อไป — ผู้ใช้ต้องกด "รับคีย์" เองที่หน้า "คีย์ของคุณ" หลังทำ 2 ขั้นตอนให้ครบก่อน:
//   1) ติดตาม YouTube — ไม่มีทาง verify จริงได้ฝั่งเซิร์ฟเวอร์โดยไม่ให้ผู้ใช้ล็อกอิน Google เพิ่ม จึงเป็นการยืนยันด้วยตัวเอง (กดยืนยันเฉย ๆ)
//   2) เข้าร่วม Discord — ตรวจจริงผ่าน Discord Bot API ก่อนออกคีย์ให้เสมอ (ต้องตั้ง DISCORD_BOT_TOKEN + DISCORD_GUILD_ID)
// แอดมินเห็นได้ในหน้า Key ผู้ใช้ ว่าคีย์ไหนมาจาก Discord บัญชีไหน (ชื่อ/รูป/IP ตอนเคลม/จำนวนครั้งที่กดรับซ้ำ)
export const discordKeyOn = () => process.env.DISCORD_KEY !== '0';
export const discordKeyDays = () => { const d = Number(process.env.DISCORD_KEY_DAYS); return Number.isFinite(d) && d >= 0 ? Math.min(d, 3650) : 30; };
export const youtubeUrl = () => process.env.YOUTUBE_CHANNEL_URL || '';
export const discordInviteUrl = () => process.env.DISCORD_INVITE_URL || '';
export const discordBotConfigured = () => !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID);
// true = อยู่ในเซิร์ฟเวอร์จริง (เช็กสดทุกครั้งผ่านบอท) · false = ไม่อยู่/เช็กไม่ได้ (API ล้ม — กันไว้ก่อน ไม่ออกคีย์ให้ถ้าเช็กไม่ได้)
export async function checkDiscordMember(discordId){
  const bot = process.env.DISCORD_BOT_TOKEN, gid = process.env.DISCORD_GUILD_ID;
  if(!bot || !gid) return false;
  try{
    const r = await fetch(`https://discord.com/api/guilds/${gid}/members/${discordId}`, { headers:{ Authorization:'Bot ' + bot.replace(/[\r\n]/g, '') } });
    return r.status === 200;
  }catch{ return false; }
}
export async function keyForDiscord(user, ip){
  if(!discordKeyOn()) return { err:'disabled' };
  const did = String(user?.id || ''); if(!/^\d{5,25}$/.test(did)) return { err:'bad_user' };
  const who = { discord_id:did, discord_name:String(user.username || '').slice(0, 40), discord_avatar:String(user.avatar || '').slice(0, 200) };
  const old = await getDiscordKey(did);
  if(typeof old === 'string' && KEY_RE.test(old)){
    const kid = kidOf(old), k = await getKey(kid);
    if(k && !k.revoked && !(k.exp && Date.now() > k.exp)){ await touchDiscordClaim(kid, who, ip); return { key:old, reused:true }; }
    if(k && k.revoked) return { err:'revoked' }; // แอดมินเพิกถอนคีย์เดิมแล้ว ไม่ออกให้ใหม่เอง ต้องให้แอดมินจัดการ
  }
  const { key, rec } = await createKey({ label:`discord:${who.discord_name || did}`, days:discordKeyDays(), scopes:['*'] });
  await setDiscordKey(did, key);
  await touchDiscordClaim(rec.kid, who, ip);
  return { key, reused:false };
}
async function touchDiscordClaim(kid, who, ip){
  const u = await getKeyUse(kid), now = Date.now();
  u.claimed_by = who; u.claim_ip = String(ip || '').slice(0, 45); u.claims = (u.claims || 0) + 1;
  u.first_claim ||= now; u.last_claim = now;
  await saveKeyUse(kid, u);
}
