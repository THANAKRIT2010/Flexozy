import fs from 'fs/promises'; import path from 'path';
const FILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'vault.json');
const useKV = !!process.env.KV_REST_API_URL;
async function kv(){ return (await import('@vercel/kv')).kv; }
export async function getVault(code){
  if(useKV) return (await (await kv()).hget('vault', code)) || null;
  try{ return JSON.parse(await fs.readFile(FILE,'utf8'))[code] || null }catch{ return null }
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
export async function pingPlayer(code, p){
  if(useKV){ await (await kv()).hset('pl:'+code, { [p.id]: p }); return; }
  let a={}; try{ a=JSON.parse(await fs.readFile(PFILE,'utf8')) }catch{}
  (a[code] ||= {})[p.id]=p; await fs.mkdir(path.dirname(PFILE),{recursive:true}); await fs.writeFile(PFILE,JSON.stringify(a));
}
export async function getPlayers(code){
  if(useKV) return Object.values((await (await kv()).hgetall('pl:'+code)) || {});
  try{ return Object.values(JSON.parse(await fs.readFile(PFILE,'utf8'))[code] || {}) }catch{ return [] }
}
