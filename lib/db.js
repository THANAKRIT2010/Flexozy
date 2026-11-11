import fs from 'fs/promises'; import path from 'path'; import { createHash as _sha } from 'crypto';
// ที่เก็บข้อมูล: Vercel KV (production) หรือไฟล์ JSON (dev / /tmp บน Vercel ซึ่งไม่ถาวร)
const DIR = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data');
const useKV = !!process.env.KV_REST_API_URL;
async function kv(){ return (await import('@vercel/kv')).kv; }
export const dbInfo = () => ({ kind: useKV ? 'kv' : 'file', persistent: useKV || !process.env.VERCEL });
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// ---------- ไฟล์ JSON (โหมด dev): เขียนแบบ atomic + คิวต่อไฟล์ กันไฟล์พังเมื่อมี request พร้อมกัน ----------
const LOCKS = globalThis.__fxLocks ||= new Map();
const locked = (file, fn) => { const p = (LOCKS.get(file) || Promise.resolve()).catch(()=>{}).then(fn); LOCKS.set(file, p); return p; };
async function readJson(name){ try{ return JSON.parse(await fs.readFile(path.join(DIR, name),'utf8')) }catch{ return {} } }
async function writeJson(name, obj){
  const f = path.join(DIR, name), tmp = f + '.' + process.pid + '.tmp';
  await fs.mkdir(DIR, { recursive:true }); await fs.writeFile(tmp, JSON.stringify(obj)); await fs.rename(tmp, f);
}
const mutate = (name, fn) => locked(name, async () => { const a = await readJson(name); const r = await fn(a); await writeJson(name, a); return r; });

// ---------- vault (ลิงก์สคริปต์) ----------
// views แยกเก็บเป็นตัวนับ (HINCRBY) — ของเดิมเขียนทับทั้งเอกสารทุกครั้งที่มีคนรัน ทำให้ค่าที่แอดมินเพิ่งแก้ (เช่น needs_key) ถูกเขียนทับกลับได้ (race)
const withViews = (v, n) => v && ({ ...v, _base: v.views || 0, views: (v.views || 0) + (Number(n) || 0) });
const forStore = (v) => { const { _base, ...r } = v; r.views = _base ?? 0; return r; };
export async function getVault(code){
  code = String(code);
  if(useKV){ const k = await kv(), v = await k.hget('vault', code); return v ? withViews(v, await k.hget('views', code)) : null; }
  const [a, w] = await Promise.all([readJson('vault.json'), readJson('views.json')]);
  return has(a, code) ? withViews(a[code], w[code]) : null;
}
export async function vaultExists(code){
  code = String(code);
  if(useKV) return !!(await (await kv()).hexists('vault', code));
  return has(await readJson('vault.json'), code);
}
// ดัชนีเมตาต่อเจ้าของ (vo:<uid>) เก็บเฉพาะข้อมูลย่อ ไม่มีซอร์สสคริปต์ → หน้า "ลิงก์ของฉัน" อ่านแค่ไม่กี่ร้อยไบต์ต่อลิงก์ แทนที่จะดึงสคริปต์ของทุกคนทั้งระบบ
const metaOf = (r) => ({ code:r.code, title:r.title, owner_id:r.owner_id, owner_name:r.owner_name, owner_avatar:r.owner_avatar || '', hash:r.hash ? 1 : 0, needs_key:!!r.needs_key, created_at:r.created_at, updated_at:r.updated_at || r.created_at, views:r.views || 0 });
const VC = globalThis.__fxVC ||= new Map(); // แคชสั้น ๆ ของ vault สำหรับ /raw /stage (ลด hget ซ้ำ ๆ)
export async function saveVault(v){
  const rec = forStore(v); VC.delete(rec.code);
  if(useKV){ const k = await kv(); await Promise.all([k.hset('vault', { [rec.code]: rec }), k.hset('vo:'+rec.owner_id, { [rec.code]: metaOf(rec) }), k.sadd('vown', String(rec.owner_id))]); return; }
  await mutate('vault.json', a => { a[rec.code] = rec; });
}
// ใช้เฉพาะเส้นทางที่ผู้รัน executor เรียก: แคช 10 วินาที ไม่อ่าน views (ประหยัด 1-2 คำสั่งต่อคำขอ) — เส้นทางแก้ไข/แอดมินใช้ getVault ที่สดเสมอ
export async function getVaultFast(code){
  code = String(code); const c = VC.get(code), now = Date.now();
  if(c && c.t > now) return c.v;
  let v;
  if(useKV){ v = await (await kv()).hget('vault', code); v = v ? withViews(v, 0) : null; }
  else v = await getVault(code);
  if(VC.size > 500) VC.clear();
  VC.set(code, { v, t:now + 10000 }); return v;
}
export async function listUserVaults(uid){
  uid = String(uid);
  if(!useKV) return (await listVaults()).filter(v => String(v.owner_id) === uid);
  const k = await kv(); let m = await k.hgetall('vo:'+uid);
  if(!m || !Object.keys(m).length){ // ข้อมูลเก่าก่อนมีดัชนี: สแกนครั้งเดียวแล้วเติมดัชนี
    const mine = (await listVaults()).filter(v => String(v.owner_id) === uid);
    if(mine.length) await k.hset('vo:'+uid, Object.fromEntries(mine.map(v => [v.code, metaOf(forStore(v))])));
    return mine;
  }
  const codes = Object.keys(m), w = (await k.hmget('views', ...codes)) || {};
  return codes.map(c => { const r = m[c]; return { ...r, hash:r.hash ? 'x' : null, views:(r.views || 0) + (Number(w[c]) || 0) }; });
}
export async function countUserVaults(uid){
  uid = String(uid);
  if(!useKV) return (await listUserVaults(uid)).length;
  const n = await (await kv()).hlen('vo:'+uid);
  return n || (await listUserVaults(uid)).length;
}
export async function vaultCounts(){
  if(!useKV){ const vs = await listVaults(); return { views:vs.reduce((a, v) => a + (v.views || 0), 0), links:vs.length, owners:new Set(vs.map(v => v.owner_id)).size }; }
  const k = await kv(), [links, vals, own] = await Promise.all([k.hlen('vault'), k.hvals('views'), k.scard('vown')]);
  let owners = own, base = 0;
  if(!owners && links){ const vs = await listVaults(); const ids = [...new Set(vs.map(v => String(v.owner_id)))]; if(ids.length) await k.sadd('vown', ...ids); owners = ids.length; }
  return { links, owners, views:(vals || []).reduce((a, n) => a + (Number(n) || 0), base) };
}
// ===== นับยอดรัน: รวมเป็นชุดในหน่วยความจำ (instance) แล้วเขียนทีเดียวผ่าน pipeline — คำขอถี่ ๆ จะถูกรวมเป็นไม่กี่คำสั่ง
// ทราฟฟิกน้อย = เขียนทันที · ทราฟฟิกสูง = รวมไม่เกิน 20 วินาที / 25 ครั้ง (instance ที่ถูกปิดกลางทางอาจเสียยอดนับท้ายชุด — เป็นสถิติ ไม่กระทบความปลอดภัย)
const VB = globalThis.__fxVB ||= { views:new Map(), daily:new Map(), n:0, t:0 };
export const dayKey = (t = Date.now()) => new Date(t + 7*3600e3).toISOString().slice(0, 10); // วันตามเวลาไทย (UTC+7)
const DAILY_TTL = 40*86400;
async function flushViews(){
  const v = [...VB.views], d = [...VB.daily]; VB.views.clear(); VB.daily.clear(); VB.n = 0; VB.t = Date.now();
  if(!v.length && !d.length) return;
  try{
    const k = await kv(), p = k.pipeline(), owners = new Set();
    for(const [c, n] of v) p.hincrby('views', c, n);
    for(const [key, n] of d){ const i = key.indexOf('|'), o = key.slice(0, i); p.hincrby('ud:'+o, key.slice(i + 1), n); owners.add(o); }
    for(const o of owners) p.expire('ud:'+o, DAILY_TTL);
    await p.exec();
  }catch{}
}
export async function bumpDaily(owner, field, n = 1){
  if(!owner) return; owner = String(owner); const f = dayKey() + ':' + field;
  if(useKV){ try{ const k = await kv(); await k.hincrby('ud:'+owner, f, n); await k.expire('ud:'+owner, DAILY_TTL); }catch{} return; }
  await mutate('daily.json', a => { const o = (a[owner] ||= {}); o[f] = (o[f] || 0) + n; });
}
export async function incrViews(code, owner){
  code = String(code);
  if(!useKV){ await mutate('views.json', a => { a[code] = (a[code] || 0) + 1; }); if(owner) await bumpDaily(owner, 'r', 1); return; }
  VB.views.set(code, (VB.views.get(code) || 0) + 1);
  if(owner){ const key = String(owner) + '|' + dayKey() + ':r'; VB.daily.set(key, (VB.daily.get(key) || 0) + 1); }
  if(++VB.n >= 25 || Date.now() - VB.t > 20000) await flushViews();
}
// สถิติรายวันของผู้ใช้ (ล่าสุด days วัน, เก่า→ใหม่): r = ยอดรัน · l = ลิงก์ที่สร้าง · k = ลิงก์ที่ล็อกรหัส · t = TOKEN ที่ใช้
export async function getDaily(owner, days = 30){
  owner = String(owner); let raw = {};
  try{ raw = useKV ? ((await (await kv()).hgetall('ud:'+owner)) || {}) : ((await readJson('daily.json'))[owner] || {}); }catch{}
  const out = [], now = Date.now();
  for(let i = days - 1; i >= 0; i--){ const d = dayKey(now - i*86400e3), g = (f) => Number(raw[d + ':' + f]) || 0; out.push({ d, r:g('r'), l:g('l'), k:g('k'), t:g('t') }); }
  return out;
}
export async function listVaults(){
  if(useKV){ const k = await kv(), [a, w] = await Promise.all([k.hgetall('vault'), k.hgetall('views')]); return Object.values(a || {}).map(v => withViews(v, (w||{})[v.code])); }
  const [a, w] = await Promise.all([readJson('vault.json'), readJson('views.json')]);
  return Object.values(a).map(v => withViews(v, w[v.code]));
}
export async function deleteVault(code){
  code = String(code);
  VC.delete(code);
  if(useKV){ const k = await kv(), v = await k.hget('vault', code); await Promise.all([k.hdel('vault', code), k.hdel('views', code), k.del('pl:'+code), v?.owner_id ? k.hdel('vo:'+v.owner_id, code) : null].filter(Boolean)); return; }
  await mutate('vault.json', a => { delete a[code]; }); await mutate('views.json', a => { delete a[code]; }); await mutate('players.json', a => { delete a[code]; });
}

// ---------- ผู้เล่นที่รันสคริปต์ (ping จากในเกม) ----------
// กัน KV เต็ม: เงียบเกิน PLAYER_TTL ถูกลบ และไม่เกิน PLAYER_MAX คนต่อลิงก์
const PLAYER_TTL = 3*86400e3, PLAYER_MAX = 1000;
const stale = (all, now) => { const ids = Object.keys(all).filter(k => !(all[k]?.ts > now-PLAYER_TTL));
  const rest = Object.keys(all).filter(k => !ids.includes(k)).sort((a,b)=>all[b].ts-all[a].ts);
  return ids.concat(rest.slice(PLAYER_MAX)); };
export async function pingPlayer(code, p){
  code = String(code);
  if(useKV){
    const k = await kv(); await k.hset('pl:'+code, { [p.id]: p });
    if(Math.random() < 0.05){ try{ const all = (await k.hgetall('pl:'+code)) || {}, del = stale(all, Date.now()); if(del.length) await k.hdel('pl:'+code, ...del); }catch{} }
    return;
  }
  await mutate('players.json', a => { const pl = (a[code] ||= {}); pl[p.id] = p; for(const id of stale(pl, Date.now())) delete pl[id]; });
}
export async function getPlayers(code){
  code = String(code);
  if(useKV) return Object.values((await (await kv()).hgetall('pl:'+code)) || {});
  const a = await readJson('players.json'); return has(a, code) ? Object.values(a[code]) : [];
}

// ---------- ตัวนับ/ล็อกแบบใช้ครั้งเดียว ----------
const MEM = globalThis.__fxMem ||= { nonce:new Map(), rl:new Map(), t:0 };
const sweep = (m, now) => { if(now - MEM.t < 30000) return; MEM.t = now; for(const [k, v] of m) if((v.t ?? v) < now) m.delete(k); };
const memNonce = (n, ttl) => { const now = Date.now(); sweep(MEM.nonce, now); if(MEM.nonce.has(n) && MEM.nonce.get(n) > now) return false; MEM.nonce.set(n, now + ttl*1000); return true; };
// คืน true ถ้าเพิ่งใช้เป็นครั้งแรก — KV ล้มเหลวจะใช้หน่วยความจำของ instance แทน (ของเดิมปล่อยผ่านทุกครั้ง = ใช้ token ซ้ำได้)
export async function claimNonce(n, ttl=90){
  if(useKV){ try{ return (await (await kv()).set('nc:'+n, 1, { nx:true, ex:ttl })) === 'OK'; }catch{} }
  return memNonce('nc:'+n, ttl);
}
// ตัวนับจำกัดความถี่ — คืนจำนวนครั้งในช่วง windowSec; KV ล้มเหลวจะนับในหน่วยความจำแทน (ของเดิมคืน 0 = ปล่อยผ่านหมด)
export async function hit(name, windowSec){
  if(useKV){ try{ const k = await kv(), key = 'rl:'+name, n = await k.incr(key); if(n === 1) await k.expire(key, windowSec); return n; }catch{} }
  const now = Date.now(); sweep(MEM.rl, now);
  const r = MEM.rl.get(name); if(!r || r.t < now){ MEM.rl.set(name, { n:1, t:now+windowSec*1000 }); return 1; }
  return ++r.n;
}

// ---------- ระบบ key ----------
// keys = นิยาม key | keyuse = สถานะการใช้ (นับ/log) | hwbind = HWID ที่ผูก (ผูกแบบ atomic: HSETNX กันสองเครื่องแย่งผูกพร้อมกัน)
const kvh = {
  get: async (name, id) => useKV ? ((await (await kv()).hget(name, id)) || null) : ((a) => has(a, id) ? a[id] : null)((await readJson('keys.json'))[name] || {}),
  set: async (name, id, val) => { if(useKV) await (await kv()).hset(name, { [id]: val }); else await mutate('keys.json', a => { (a[name] ||= {})[id] = val; }); },
  all: async (name) => useKV ? ((await (await kv()).hgetall(name)) || {}) : ((await readJson('keys.json'))[name] || {}),
  del: async (name, id) => { if(useKV) await (await kv()).hdel(name, id); else await mutate('keys.json', a => { if(a[name]) delete a[name][id]; }); },
};
export const getKey = (kid) => kvh.get('keys', kid);
export const saveKey = (k) => kvh.set('keys', k.kid, k);
export const listKeys = async () => Object.values(await kvh.all('keys'));
export const getKeyUse = async (kid) => (await kvh.get('keyuse', kid)) || { hwid:null, uses:0, last_used:0, last_ip:'', events:[] };
export const saveKeyUse = (kid, u) => kvh.set('keyuse', kid, u);
export const listKeyUse = () => kvh.all('keyuse');
export async function deleteKey(kid){ await kvh.del('keys', kid); await kvh.del('keyuse', kid); await kvh.del('hwbind', kid); }
// ผูก HWID แบบ atomic — คืน HWID ที่ผูกอยู่จริง (อาจไม่ใช่ตัวที่ส่งมา ถ้ามีคนผูกไปก่อน)
export async function claimHwid(kid, hh){
  if(useKV){ const k = await kv(); await k.hsetnx('hwbind', kid, hh); return await k.hget('hwbind', kid); }
  return mutate('keys.json', a => { const b = (a.hwbind ||= {}); if(!has(b, kid)) b[kid] = hh; return b[kid]; });
}
// ลบ key ทั้งหมด (พร้อมประวัติการใช้และ HWID ที่ผูก) — คืนจำนวนที่ลบ
export async function deleteAllKeys(){
  const n = Object.keys(await kvh.all('keys')).length;
  if(useKV){ const k = await kv(); await k.del('keys'); await k.del('keyuse'); await k.del('hwbind'); await k.del('autokey'); }
  else await mutate('keys.json', a => { a.keys = {}; a.keyuse = {}; a.hwbind = {}; a.autokey = {}; });
  return n;
}
// คีย์ที่ระบบออกให้อัตโนมัติ ผูกกับ HWID (hash) — เก็บตัวคีย์เต็มไว้เพื่อส่งให้เครื่องเดิมซ้ำได้
export const getAutoKey = (hh) => kvh.get('autokey', hh);
export const setAutoKey = (hh, key) => kvh.set('autokey', hh, key);
export const releaseHwid = (kid) => kvh.del('hwbind', kid);
export const getBoundHwid = (kid) => kvh.get('hwbind', kid);

// ---------- ตัวช่วยป้องกัน (anti-dump) ----------
// peek: อ่านตัวนับของ hit() โดยไม่เพิ่ม | decr: ลดตัวนับ (ไม่ต่ำกว่า 0) | flag/isFlagged: ธงชั่วคราว (เช่น แบนไอพี)
export async function peek(name){
  if(useKV){ try{ return Number(await (await kv()).get('rl:'+name)) || 0; }catch{} }
  const r = MEM.rl.get(name); return r && r.t > Date.now() ? r.n : 0;
}
export async function decr(name){
  if(useKV){ try{ const k = await kv(), key = 'rl:'+name, n = Number(await k.get(key)) || 0; if(n > 0) await k.decr(key); return; }catch{} }
  const r = MEM.rl.get(name); if(r && r.n > 0) r.n--;
}
const FC = globalThis.__fxFC ||= new Map();
// IP → คีย์แบน: IPv4 ตรง ๆ · ::ffff:1.2.3.4 → 1.2.3.4 · IPv6 → ทั้ง /64 (ผู้ใช้ IPv6 หมุนเลขท้ายได้เป็นล้านที่อยู่ ถ้าแบนทีละที่อยู่จะหลบได้ทันที)
export function ipKey(ip){
  ip = String(ip || '').trim().toLowerCase(); if(ip.endsWith('::/64')) return ip;
  const m = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/); if(m) return m[1];
  if(!ip.includes(':')) return ip;
  const [h, t = ''] = ip.split('::'), a = h ? h.split(':') : [], b = t ? t.split(':') : [];
  const full = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a;
  return full.length < 4 ? ip : full.slice(0, 4).map(x => (x || '0').replace(/^0+(?=.)/, '')).join(':') + '::/64';
}
const nn = (name) => name.startsWith('ban:') ? 'ban:' + ipKey(name.slice(4)) : name;
export async function flag(name, ttlSec, opt = {}){
  name = nn(name);
  FC.set(name, { v:true, t:Date.now() + Math.min(ttlSec, 30)*1000 });
  let done = false;
  if(useKV){ try{ await (await kv()).set('fl:'+name, 1, { ex:ttlSec }); done = true; }catch{} }
  if(!done) MEM.nonce.set('fl:'+name, Date.now() + ttlSec*1000);
  // แบนอัตโนมัติ (strike / dump) ถูกบันทึกลงรายการแบนด้วย เพื่อให้แอดมินเห็นและปลดบล็อกได้จากหลังบ้าน
  if(name.startsWith('ban:') && !opt.manual) await saveBan(name.slice(4), { sec:ttlSec, reason:'ระบบแบนอัตโนมัติ', by:'system', auto:true }).catch(() => {});
}
export async function unflag(name){
  name = nn(name);
  FC.delete(name); MEM.nonce.delete('fl:'+name);
  if(useKV){ try{ await (await kv()).del('fl:'+name); }catch{} }
}
export async function isFlagged(name){
  name = nn(name);
  if(useKV){
    const c = FC.get(name), now = Date.now(); if(c && c.t > now) return c.v;
    try{ const v = !!(await (await kv()).exists('fl:'+name)); if(FC.size > 2000) FC.clear(); FC.set(name, { v, t:now + (v ? 30000 : 2000) }); return v; }catch{}
  }
  return (MEM.nonce.get('fl:'+name) || 0) > Date.now();
}

// ---------- บันทึกเหตุการณ์ความปลอดภัย (แสดงในหลังบ้าน /admin/settings) เก็บล่าสุด 100 รายการ ----------
const SEC_MAX = 100;
export async function logSec(type, ip, info = ''){
  const ev = { t:type, ts:Date.now(), ip:String(ip||'').replace(/(\d+)$/, '*').replace(/([0-9a-f]+)$/i, (m) => m.length > 3 ? '*' : m), info:String(info).slice(0, 120) };
  try{
    if(useKV){ const k = await kv(); await k.lpush('seclog', ev); await k.ltrim('seclog', 0, SEC_MAX - 1); return; }
    await mutate('seclog.json', a => { a.list = [ev, ...(a.list || [])].slice(0, SEC_MAX); });
  }catch{}
}
export async function listSec(){
  try{
    if(useKV) return (await (await kv()).lrange('seclog', 0, SEC_MAX - 1)) || [];
    return (await readJson('seclog.json')).list || [];
  }catch{ return []; }
}
export async function secCounts(){
  const list = await listSec(), day = Date.now() - 86400e3, by = {};
  for(const e of list) if(e.ts > day) by[e.t] = (by[e.t] || 0) + 1;
  return by;
}

// ---------- โค้ดต้นฉบับของแมพที่แอดมินแก้เอง (ทับ Script URL) ----------
export const getGameCode = (id) => kvh.get('gamecode', id);
export const saveGameCode = (id, code) => kvh.set('gamecode', id, { code, updated_at: Date.now() });
export const deleteGameCode = (id) => kvh.del('gamecode', id);
export const listGameCodeIds = async () => Object.keys(await kvh.all('gamecode'));

// ---------- TOKEN wallet (บัญชีใหม่ได้ TOKEN เริ่มต้น · ฝากลิงก์ล็อกรหัสหักต่อครั้ง) ----------
// เก็บใน hash 'wallet' (KV) หรือ data/wallet.json (dev) — หักแบบ atomic: KV ใช้ HINCRBY แล้วคืนถ้าติดลบ, ไฟล์ใช้ mutate (มี lock)
const envNum = (name, def) => { const n = Number(process.env[name]); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def; };
export const startTokens = () => envNum('TOKEN_START', 10000);
export const lockCost = () => envNum('TOKEN_LOCK_COST', 1000);
export async function getTokens(uid){
  uid = String(uid);
  if(useKV){ const k = await kv(); let v = await k.hget('wallet', uid); if(v == null){ await k.hsetnx('wallet', uid, startTokens()); v = await k.hget('wallet', uid); } return Number(v) || 0; }
  return mutate('wallet.json', a => { if(!has(a, uid)) a[uid] = startTokens(); return a[uid]; });
}
export async function spendTokens(uid, cost){
  uid = String(uid); cost = Math.max(0, Math.floor(Number(cost) || 0));
  await getTokens(uid);
  if(useKV){ const k = await kv(), left = await k.hincrby('wallet', uid, -cost); if(left < 0){ await k.hincrby('wallet', uid, cost); return { ok:false, balance:left + cost }; } return { ok:true, balance:left }; }
  return mutate('wallet.json', a => { const b = a[uid] ?? 0; if(b < cost) return { ok:false, balance:b }; a[uid] = b - cost; return { ok:true, balance:a[uid] }; });
}
export async function addTokens(uid, n){
  uid = String(uid); n = Math.floor(Number(n) || 0); await getTokens(uid);
  if(useKV) return Number(await (await kv()).hincrby('wallet', uid, n));
  return mutate('wallet.json', a => { a[uid] = Math.max(0, (a[uid] ?? 0) + n); return a[uid]; });
}

// ---------- รายการแบน IP (จัดการจากหลังบ้าน /admin/settings) ----------
// การแบนใช้แฟล็กเดิม 'ban:<ip>' ที่ทุกเส้นทางของ executor (/loader /raw /stage /auth) ตรวจอยู่แล้ว — รายการนี้มีไว้แสดง/ปลดบล็อก
const BAN_MAX = 500, BAN_FOREVER = 10*365*86400;
export const validIp = (ip) => typeof ip === 'string' && (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) ? ip.split('.').every(n => Number(n) <= 255) : /^[0-9a-fA-F:]{2,45}$/.test(ip) && ip.includes(':'));
async function saveBan(ip, { sec = 0, reason = '', by = '', auto = false, type = 'ip', label = '' }){
  const rec = { ip, type, label:String(label).slice(0, 80), reason:String(reason).slice(0, 120), by:String(by).slice(0, 64), ts:Date.now(), exp:sec > 0 && sec < BAN_FOREVER ? Date.now() + sec*1000 : 0, auto:!!auto };
  if(useKV){ await (await kv()).hset('bans', { [ip]:rec }); return rec; }
  await mutate('bans.json', a => { a[ip] = rec; }); return rec;
}
export async function banIp(ip, { sec = 0, reason = '', by = '' } = {}){
  ip = String(ip || '').trim(); if(!validIp(ip)) throw new Error('bad_ip'); ip = ipKey(ip);
  await flag('ban:' + ip, sec > 0 ? Math.floor(sec) : BAN_FOREVER, { manual:true });
  return saveBan(ip, { sec, reason, by, label:ip.endsWith('/64') ? 'IPv6 ทั้งช่วง /64' : '' });
}
export async function unbanIp(x){ return unbanKey(x); }
export const validBanKey = (k) => typeof k === 'string' && (/^hw:[0-9a-f]{32}$/.test(k) || /^uid:\d{1,16}$/.test(k) || /^[0-9a-f:]+::\/64$/.test(k) || validIp(k));
// ปลดบล็อกตามคีย์ของรายการ: IP · IPv6 ::/64 · hw:<hash> · uid:<id>
export async function unbanKey(k){
  k = String(k || '').trim(); if(!validBanKey(k)) throw new Error('bad_key');
  if(k.startsWith('hw:')) await unflag('banhw:' + k.slice(3)); else if(k.startsWith('uid:')) await unflag('banuid:' + k.slice(4));
  else { await unflag('ban:' + k);
    // ล้างตัวนับ strike/debt ด้วย ไม่งั้นปลดแล้วโดนแบนซ้ำทันที
    for(const n of ['strike:', 'ldrdebt:', 'rawdebt:']){ if(useKV){ try{ await (await kv()).del('rl:' + n + k); }catch{} } else MEM.rl.delete(n + k); } }
  if(useKV) await (await kv()).hdel('bans', k); else await mutate('bans.json', a => { delete a[k]; });
}
// แบนตามตัวตน: ip | hw (HWID จริง) | uid (Roblox UserId) — HWID/uid ถูกตรวจที่ /auth และ /ping; แบนเครื่องไหนแล้ว IP ใหม่ที่เครื่องนั้นใช้จะถูกแบนตามอัตโนมัติ
export const hwKey = (hw) => _sha('sha256').update('hw:' + String(hw).trim()).digest('hex').slice(0, 32);
export async function banId(type, value, { sec = 0, reason = '', by = '' } = {}){
  value = String(value || '').trim();
  if(type === 'ip') return banIp(value, { sec, reason, by });
  const ttl = sec > 0 ? Math.floor(sec) : BAN_FOREVER;
  if(type === 'hw'){ if(value.length < 8 || value.length > 256) throw new Error('bad_hw'); const h = hwKey(value);
    await flag('banhw:' + h, ttl, { manual:true }); return saveBan('hw:' + h, { sec, reason, by, type:'hw', label:value.slice(0, 14) + (value.length > 14 ? '…' : '') }); }
  if(type === 'uid'){ if(!/^\d{1,16}$/.test(value) || Number(value) <= 0) throw new Error('bad_uid');
    await flag('banuid:' + value, ttl, { manual:true }); return saveBan('uid:' + value, { sec, reason, by, type:'uid', label:'Roblox ID ' + value }); }
  throw new Error('bad_type');
}
// ตรวจตัวตนที่ส่งมากับคำขอ (hwid / uid) ว่าถูกแบนไหม
export async function bannedIdent({ hwid, uid } = {}){
  if(hwid && String(hwid).length >= 8 && await isFlagged('banhw:' + hwKey(hwid))) return true;
  if(uid && /^\d{1,16}$/.test(String(uid)) && Number(uid) > 0 && await isFlagged('banuid:' + String(uid))) return true;
  return false;
}
export async function listBans(){
  const now = Date.now(); let all = {};
  try{ all = useKV ? ((await (await kv()).hgetall('bans')) || {}) : await readJson('bans.json'); }catch{}
  const live = [], dead = [];
  for(const r of Object.values(all)){ (r.exp && r.exp < now ? dead : live).push(r); }
  if(dead.length){ // หมดอายุแล้ว: เก็บกวาดรายการ
    if(useKV){ try{ await (await kv()).hdel('bans', ...dead.map(r => r.ip)); }catch{} } else await mutate('bans.json', a => { dead.forEach(r => delete a[r.ip]); });
  }
  return live.sort((a, b) => b.ts - a.ts).slice(0, BAN_MAX);
}

// ---------- เติมเงินด้วยซอง TrueMoney (v20): กันซองซ้ำ + ประวัติต่อผู้ใช้ ----------
// ซอง 1 ใบ = 1 ครั้งตลอดกาล (hsetnx / ไฟล์) · status: pending → credited | failed | review · failed ลองใหม่ได้
export async function claimVoucher(code, rec){
  if(useKV){ const k = await kv(); if(await k.hsetnx('tmn', code, rec)) return { ok:true };
    const o = await k.hget('tmn', code); if(o?.status === 'failed'){ await k.hset('tmn', { [code]: rec }); return { ok:true }; } return { ok:false, status:o?.status || 'pending' }; }
  return mutate('tmn.json', a => { const o = a[code]; if(o && o.status !== 'failed') return { ok:false, status:o.status }; a[code] = rec; return { ok:true }; });
}
export async function setVoucher(code, patch){
  if(useKV){ const k = await kv(), o = (await k.hget('tmn', code)) || {}; await k.hset('tmn', { [code]: { ...o, ...patch } }); return; }
  await mutate('tmn.json', a => { a[code] = { ...(a[code] || {}), ...patch }; });
}
export async function pushTopup(uid, row){
  if(useKV){ const k = await kv(); await k.lpush('tmu:' + uid, row); await k.ltrim('tmu:' + uid, 0, 29); return; }
  await mutate('tmu.json', a => { a[uid] = [row, ...(a[uid] || [])].slice(0, 30); });
}
export async function listTopups(uid){
  if(useKV) return (await (await kv()).lrange('tmu:' + uid, 0, 29)) || [];
  return (await mutate('tmu.json', a => a[uid] || [])) || [];
}

// ---------- v21: บันทึกผู้ที่ส่งคำขอ/รันสคริปต์ (IP · HWID · Roblox) ให้แอดมินดูและแบนได้ ----------
// รวมรายการต่อ IP (IPv6 ต่อ /64) · เขียนไม่เกิน 1 ครั้ง/30 วิ ต่อ IP+ช่องทาง เพื่อไม่ให้ KV บวม · เก็บสูงสุด ~800 รายการล่าสุด
const SEEN_MAX = 800, clS = (v, n) => String(v || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
export async function noteSeen(x = {}){
  try{
    const ipk = ipKey(x.ip || 'local'), src = clS(x.src, 12);
    const n = await hit('seenn:' + ipk, 86400);                 // จำนวนคำขอใน 24 ชม.
    if(await hit('seenw:' + ipk + ':' + src, 30) > 1 && !x.hwid && !x.uid) return;
    const now = Date.now(), hw = x.hwid && String(x.hwid).length >= 8 ? clS(x.hwid, 128) : '', uid = /^\d{1,16}$/.test(String(x.uid || '')) ? Number(x.uid) : 0;
    const merge = (o = {}) => ({ ...o, ip:ipk, raw:clS(x.ip, 45) || o.raw || '', first:o.first || now, last:now, n,
      src, code:clS(x.code, 40) || o.code || '', hw:hw || o.hw || '', hh:hw ? hwKey(hw) : (o.hh || ''), uid:uid || o.uid || 0,
      un:clS(x.un, 40) || o.un || '', dn:clS(x.dn, 50) || o.dn || '' });
    if(useKV){ const k = await kv(); await k.hset('seen', { [ipk]:merge(await k.hget('seen', ipk) || {}) });
      if(n === 1 && await k.hlen('seen') > SEEN_MAX){ const all = await k.hgetall('seen') || {}, old = Object.values(all).sort((a, b) => a.last - b.last).slice(0, 100).map(r => r.ip); if(old.length) await k.hdel('seen', ...old); } return; }
    await mutate('seen.json', a => { a[ipk] = merge(a[ipk]); const ks = Object.keys(a); if(ks.length > SEEN_MAX) ks.sort((p, q) => a[p].last - a[q].last).slice(0, 100).forEach(d => delete a[d]); });
  }catch{}
}
export async function listSeen(limit = 400){
  let all = {}; try{ all = useKV ? ((await (await kv()).hgetall('seen')) || {}) : await readJson('seen.json'); }catch{}
  return Object.values(all).sort((a, b) => b.last - a.last).slice(0, limit);
}
