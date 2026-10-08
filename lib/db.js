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
