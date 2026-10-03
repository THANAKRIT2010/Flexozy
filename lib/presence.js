import fs from 'fs/promises';
import path from 'path';

const FILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'presence.json');
const TTL = 90_000;
const key = code => `presence:${code}`;
async function readAll(){
  if(process.env.KV_REST_API_URL) return null;
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return {}; }
}
export async function listPlayers(code){
  let entries;
  if(process.env.KV_REST_API_URL){
    const { kv } = await import('@vercel/kv');
    entries = await kv.hgetall(key(code)) || {};
  } else entries = (await readAll())[code] || {};
  return Object.values(entries).filter(p => p && Date.now() - p.seen < TTL)
    .map(({ name, userId, jobId }) => ({ name, userId, jobId }));
}
export async function updatePlayer(code, { name, userId, jobId }){
  const now = Date.now();
  const record = { name: String(name).slice(0, 32), userId: String(userId).slice(0, 24), jobId: String(jobId || '').slice(0, 80), seen: now };
  if(process.env.KV_REST_API_URL){
    const { kv } = await import('@vercel/kv');
    await kv.hset(key(code), { [record.userId]: record });
    await kv.expire(key(code), 86400);
  } else {
    const all = await readAll();
    all[code] = Object.fromEntries(Object.entries(all[code] || {}).filter(([, p]) => p && now - p.seen < TTL));
    all[code][record.userId] = record;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all));
  }
}
export async function clearPlayers(code){
  if(process.env.KV_REST_API_URL){
    const { kv } = await import('@vercel/kv'); await kv.del(key(code));
  } else {
    const all = await readAll(); delete all[code];
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all));
  }
}
