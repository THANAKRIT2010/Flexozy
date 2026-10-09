import fs from 'fs/promises'; import path from 'path';
const FILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'vault.json');
const useKV = !!process.env.KV_REST_API_URL;
async function kv(){ return (await import('@vercel/kv')).kv; }
export async function getVault(code){
  if(useKV) return (await (await kv()).hget('vault', code)) || null;
  try{ return JSON.parse(await fs.readFile(FILE,'utf8'))[code] || null }catch{ return null }
}
// เช็คว่ามีลิงก์จริงไหมแบบเบา (ไม่ดึงซอสทั้งก้อนจาก KV) — ใช้ใน /ping ที่ถูกเรียกบ่อย
export async function vaultExists(code){
  if(useKV) return !!(await (await kv()).hexists('vault', code));
  return !!(await getVault(code));
}
export async function saveVault(v){
  if(useKV){ await (await kv()).hset('vault', { [v.code]: v }); return; }
  let all={}; try{ all=JSON.parse(await fs.readFile(FILE,'utf8')) }catch{}
  all[v.code]=v; await fs.mkdir(path.dirname(FILE),{recursive:true}); await fs.writeFile(FILE,JSON.stringify(all));
}
export async function listVaults(){
  if(useKV) return Object.values((await (await kv()).hgetall('vault')) || {});
  try{ return Object.values(JSON.parse(await fs.readFile(FILE,'utf8'))) }catch{ return [] }
}
export async function deleteVault(code){
  if(useKV){ const k=await kv(); await k.hdel('vault', code); await k.del('pl:'+code); return; }
  try{ const a=JSON.parse(await fs.readFile(FILE,'utf8')); delete a[code]; await fs.writeFile(FILE,JSON.stringify(a)); }catch{}
  try{ const a=JSON.parse(await fs.readFile(PFILE,'utf8')); delete a[code]; await fs.writeFile(PFILE,JSON.stringify(a)); }catch{}
}
// ผู้เล่นที่รันสคริปต์ (ping จากในเกม) — เก็บแยกตามโค้ดลิงก์
const PFILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'players.json');
// กัน KV เต็ม: ผู้เล่นที่เงียบเกิน PLAYER_TTL ถูกลบทิ้ง และจำกัดไม่เกิน PLAYER_MAX คนต่อลิงก์ (ล้างเป็นครั้งคราวตอนมี ping เข้ามา ไม่ต้องมี cron)
const PLAYER_TTL = 3*86400e3, PLAYER_MAX = 1000;
const stale = (all, now) => { const ids = Object.keys(all).filter(k => !(all[k]?.ts > now-PLAYER_TTL));
  const rest = Object.keys(all).filter(k => !ids.includes(k)).sort((a,b)=>all[b].ts-all[a].ts);
  return ids.concat(rest.slice(PLAYER_MAX)); };
export async function pingPlayer(code, p){
  if(useKV){
    const k = await kv(); await k.hset('pl:'+code, { [p.id]: p });
    if(Math.random() < 0.05){ // ~1 ใน 20 ping: ตรวจและลบรายชื่อเก่า
      try{ const all = (await k.hgetall('pl:'+code)) || {}, del = stale(all, Date.now()); if(del.length) await k.hdel('pl:'+code, ...del); }catch{}
    }
    return;
  }
  let a={}; try{ a=JSON.parse(await fs.readFile(PFILE,'utf8')) }catch{}
  const pl = (a[code] ||= {}); pl[p.id]=p; for(const id of stale(pl, Date.now())) delete pl[id];
  await fs.mkdir(path.dirname(PFILE),{recursive:true}); await fs.writeFile(PFILE,JSON.stringify(a));
}
export async function getPlayers(code){
  if(useKV) return Object.values((await (await kv()).hgetall('pl:'+code)) || {});
  try{ return Object.values(JSON.parse(await fs.readFile(PFILE,'utf8'))[code] || {}) }catch{ return [] }
}

// token ใช้ครั้งเดียว: คืน true ถ้าเพิ่งใช้เป็นครั้งแรก (KV ล้มเหลว = ปล่อยผ่าน เพื่อไม่ให้สคริปต์ผู้ใช้พังทั้งระบบ)
const NONCES = globalThis.__fxNonce ||= new Map();
export async function claimNonce(n, ttl=90){
  try{
    if(useKV){ const r = await (await kv()).set('nc:'+n, 1, { nx:true, ex:ttl }); return r === 'OK'; }
    const now = Date.now(); for(const [k,t] of NONCES) if(t<now) NONCES.delete(k);
    if(NONCES.has(n)) return false; NONCES.set(n, now+ttl*1000); return true;
  }catch{ return true }
}

// ===== ระบบ key (lib/keys.js) =====
// keys = นิยาม key (เปลี่ยนเฉพาะตอนแอดมินแก้) | keyuse = สถานะการใช้ (HWID ที่ผูก, จำนวนครั้ง, log) แยกกันเพื่อไม่ให้เขียนทับกัน
const KFILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'keys.json');
const hget = async (name, id) => {
  if(useKV) return (await (await kv()).hget(name, id)) || null;
  try{ return JSON.parse(await fs.readFile(KFILE,'utf8'))[name]?.[id] || null }catch{ return null }
};
const hset = async (name, id, val) => {
  if(useKV){ await (await kv()).hset(name, { [id]: val }); return; }
  let a={}; try{ a=JSON.parse(await fs.readFile(KFILE,'utf8')) }catch{}
  (a[name] ||= {})[id]=val; await fs.mkdir(path.dirname(KFILE),{recursive:true}); await fs.writeFile(KFILE,JSON.stringify(a));
};
const hall = async (name) => {
  if(useKV) return (await (await kv()).hgetall(name)) || {};
  try{ return JSON.parse(await fs.readFile(KFILE,'utf8'))[name] || {} }catch{ return {} }
};
const hdel = async (name, id) => {
  if(useKV){ await (await kv()).hdel(name, id); return; }
  try{ const a=JSON.parse(await fs.readFile(KFILE,'utf8')); if(a[name]) delete a[name][id]; await fs.writeFile(KFILE,JSON.stringify(a)); }catch{}
};
export const getKey = (kid) => hget('keys', kid);
export const saveKey = (k) => hset('keys', k.kid, k);
export const listKeys = async () => Object.values(await hall('keys'));
export const getKeyUse = async (kid) => (await hget('keyuse', kid)) || { hwid:null, uses:0, last_used:0, last_ip:'', events:[] };
export const saveKeyUse = (kid, u) => hset('keyuse', kid, u);
export const listKeyUse = () => hall('keyuse');
export async function deleteKey(kid){ await hdel('keys', kid); await hdel('keyuse', kid); }

// ตัวนับจำกัดความถี่ (rate limit): คืนจำนวนครั้งในช่วง windowSec (ล้มเหลว = 0 คือปล่อยผ่าน)
const RL = globalThis.__fxRL ||= new Map();
export async function hit(name, windowSec){
  try{
    if(useKV){ const k = await kv(), key='rl:'+name, n = await k.incr(key); if(n===1) await k.expire(key, windowSec); return n; }
    const now = Date.now(); for(const [x,r] of RL) if(r.t<now) RL.delete(x);
    const r = RL.get(name) || { n:0, t:now+windowSec*1000 }; r.n++; RL.set(name, r); return r.n;
  }catch{ return 0 }
}
