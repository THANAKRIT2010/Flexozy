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
