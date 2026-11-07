import fs from 'fs/promises';
import path from 'path';
import { checkScriptUrl } from './safeFetch';
const FILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'games.json');
const useKV = !!process.env.KV_REST_API_URL;
async function kv(){ return (await import('@vercel/kv')).kv; }
export function normalizeGame(input, index=0){
  const name = String(input?.name || '').trim().slice(0,80);
  const slugBase = String(input?.id || name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
  const id = slugBase || `game-${index+1}`;
  const rawIds = Array.isArray(input?.placeIds) ? input.placeIds : String(input?.placeIds ?? input?.placeId ?? '').split(/[\s,;]+/);
  const placeIds = [...new Set(rawIds.map(v=>String(v).trim()).filter(v=>/^\d{1,16}$/.test(v) && Number(v)>0))];
  let url = String(input?.url || '').trim();
  if(!name) throw new Error('กรุณาระบุชื่อแมพ');
  if(url){ try{ url = checkScriptUrl(url); }catch(e){ throw new Error(`${name}: ${e.message}`); } }
  return { id, name, placeIds, aliases:(Array.isArray(input?.aliases) ? input.aliases.join(',') : String(input?.aliases||'')).split(',').map(s=>s.trim().slice(0,60)).filter(Boolean).slice(0,30), url, updatedAt:Date.now() };
}
export async function getGameOverrides(){
  if(useKV){ const k=await kv(); return (await k.get('game-config')) || []; }
  try { return JSON.parse(await fs.readFile(FILE,'utf8')); } catch { return []; }
}
export async function saveGameOverrides(games){
  if(useKV){ await (await kv()).set('game-config', games); return; }
  await fs.mkdir(path.dirname(FILE),{recursive:true});
  await fs.writeFile(FILE, JSON.stringify(games,null,2));
}
