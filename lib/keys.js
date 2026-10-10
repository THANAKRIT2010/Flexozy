import crypto from 'crypto';
import { SECRET } from './secret';
import { getKey, saveKey, getKeyUse, saveKeyUse, claimHwid } from './db';
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
export const keyUsable = (k, scope) => !!k && !k.revoked && !(k.exp && Date.now() > k.exp) && scopeOk(k, scope);

// ===== /auth =====
export async function authorize(key, hwid, scope, ip, who = {}){
  if(!KEY_RE.test(key) || !SCOPE_RE.test(scope) || typeof hwid !== 'string' || hwid.length < 4 || hwid.length > 256) return { err:'invalid_key' };
  const kid = kidOf(key), k = await getKey(kid);
  if(!keyUsable(k, scope)) return { err: k && !k.revoked && !(k.exp && Date.now() > k.exp) && !scopeOk(k, scope) ? 'scope' : 'invalid_key' };
  const u = await getKeyUse(kid), hh = hwHash(hwid), now = Date.now();
  const ev = (t) => { u.events = [{ t, ts: now, ip, hw: hh.slice(0, 8), scope }, ...(u.events||[])].slice(0, 30); };
  // ผูก HWID แบบ atomic (HSETNX) — สองเครื่องยิงพร้อมกัน มีได้แค่เครื่องเดียวที่ผูกสำเร็จ; ข้อมูลเก่าที่เก็บ hwid ใน keyuse ยังใช้ได้
  const bound = u.hwid || await claimHwid(kid, hh);
  if(bound !== hh){ ev('hwid_mismatch'); u.denied = (u.denied||0) + 1; await saveKeyUse(kid, u); return { err:'hwid_mismatch' }; }
  if(!u.hwid){ u.hwid = hh; ev('bind'); }
  u.uses = (u.uses||0) + 1; u.last_used = now; u.last_ip = ip;
  // โปรไฟล์ Roblox ที่ใช้ key นี้ (ส่งมาจากสคริปต์ใน Hub) + จำนวนครั้งที่ "รันสคริปต์" (นับเฉพาะ scope hub:ID / v:CODE ไม่นับการเข้า Hub)
  const uid = /^\d{1,16}$/.test(String(who.uid||'')) && Number(who.uid) > 0 ? String(who.uid) : '', un = /^[A-Za-z0-9_]{1,40}$/.test(String(who.un||'')) ? String(who.un) : '';
  if(uid){ u.roblox_id = uid; u.roblox_name = un || u.roblox_name || ''; }
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
