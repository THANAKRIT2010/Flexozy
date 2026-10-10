import fs from 'fs/promises'; import path from 'path';
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
export async function saveVault(v){
  const rec = forStore(v);
  if(useKV){ await (await kv()).hset('vault', { [rec.code]: rec }); return; }
  await mutate('vault.json', a => { a[rec.code] = rec; });
}
export async function incrViews(code){
  code = String(code);
  if(useKV){ await (await kv()).hincrby('views', code, 1); return; }
  await mutate('views.json', a => { a[code] = (a[code] || 0) + 1; });
}
export async function listVaults(){
  if(useKV){ const k = await kv(), [a, w] = await Promise.all([k.hgetall('vault'), k.hgetall('views')]); return Object.values(a || {}).map(v => withViews(v, (w||{})[v.code])); }
  const [a, w] = await Promise.all([readJson('vault.json'), readJson('views.json')]);
  return Object.values(a).map(v => withViews(v, w[v.code]));
}
export async function deleteVault(code){
  code = String(code);
  if(useKV){ const k = await kv(); await k.hdel('vault', code); await k.hdel('views', code); await k.del('pl:'+code); return; }
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
  if(useKV){ const k = await kv(); await k.del('keys'); await k.del('keyuse'); await k.del('hwbind'); }
  else await mutate('keys.json', a => { a.keys = {}; a.keyuse = {}; a.hwbind = {}; });
  return n;
}
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
export async function flag(name, ttlSec){
  if(useKV){ try{ await (await kv()).set('fl:'+name, 1, { ex:ttlSec }); return; }catch{} }
  MEM.nonce.set('fl:'+name, Date.now() + ttlSec*1000);
}
export async function isFlagged(name){
  if(useKV){ try{ return !!(await (await kv()).exists('fl:'+name)); }catch{} }
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
