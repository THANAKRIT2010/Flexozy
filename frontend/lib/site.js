import fs from 'fs/promises';
import path from 'path';
import { listVaults, listKeys } from './db';
import { allGames } from './games';
// ตั้งค่าหน้าตาเว็บ: ธีมสี · ข้อความหน้าแรก · ช่องสถิติที่แก้ไขได้ (เก็บใน Vercel KV หรือไฟล์ data/site.json)
const FILE = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'site.json');
const useKV = !!process.env.KV_REST_API_URL;
async function kv(){ return (await import('@vercel/kv')).kv; }

import { THEMES, SOURCES, ICON_IDS, themeVars, statValue } from './siteTheme';
export { THEMES, SOURCES, ICON_IDS, themeVars, statValue };
const HEX = /^#[0-9a-f]{6}$/i;

export const DEFAULT_SITE = {
  theme:'violet', accent:'#7c5cff',
  hero:{ title:'FLEXOZY', tagline:'ฝากสคริปต์เป็นลิงก์ส่วนตัว วางโค้ด แปลงเป็นลิงก์ ตั้งรหัสผ่านได้ และดูคนรันในเกมได้', badge:'Script Hub' },
  showStats:true, countMs:1800,
  stats:[
    { id:'views', label:'ยอดรันทั้งหมด', unit:'ครั้ง', icon:'play', source:'views', value:0, offset:0, show:true },
    { id:'links', label:'ลิงก์ที่ฝากไว้', unit:'ลิงก์', icon:'link', source:'links', value:0, offset:0, show:true },
    { id:'keys', label:'Key ที่ใช้งานได้', unit:'key', icon:'key', source:'keys', value:0, offset:0, show:true },
    { id:'maps', label:'แมพที่รองรับ', unit:'แมพ', icon:'map', source:'maps', value:0, offset:0, show:true },
  ],
};
const str = (v, n) => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n) : '';
const num = (v, min, max, d = 0) => { v = Number(v); return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d; };
export function normalizeSite(i){
  i = i && typeof i === 'object' ? i : {};
  const d = DEFAULT_SITE, seen = new Set();
  const stats = (Array.isArray(i.stats) ? i.stats : d.stats).slice(0, 8).map((s, n) => {
    let id = str(s?.id, 24).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 's' + (n + 1); while(seen.has(id)) id += 'x'; seen.add(id);
    return { id, label:str(s?.label, 40) || 'สถิติ', unit:str(s?.unit, 16), icon:ICON_IDS.includes(s?.icon) ? s.icon : 'star',
      source:SOURCES[s?.source] ? s.source : 'manual', value:num(s?.value, 0, 1e12), offset:num(s?.offset, -1e12, 1e12), show:s?.show !== false };
  });
  return {
    theme:(i.theme === 'custom' || THEMES[i.theme]) ? i.theme : d.theme,
    accent:HEX.test(i.accent || '') ? i.accent.toLowerCase() : d.accent,
    hero:{ title:str(i.hero?.title, 40) || d.hero.title, tagline:str(i.hero?.tagline, 200) || d.hero.tagline, badge:str(i.hero?.badge, 40) },
    showStats:i.showStats !== false, countMs:num(i.countMs, 600, 6000, 1800), stats,
  };
}

// ---------- เก็บ/อ่าน (แคชสั้น ๆ กันยิง KV ทุกหน้า) ----------
const C = globalThis.__fxSite ||= {};
const memo = (k, ttl, fn) => { const c = C[k]; if(c && c.t > Date.now()) return c.p; const p = fn().catch(e => { delete C[k]; throw e; }); C[k] = { t:Date.now() + ttl, p }; return p; };
export const getSite = () => memo('site', 5000, async () => {
  let raw = null;
  try{ raw = useKV ? await (await kv()).get('site-config') : JSON.parse(await fs.readFile(FILE, 'utf8')); }catch{}
  return normalizeSite(raw);
});
export async function saveSite(input){
  const cfg = normalizeSite(input);
  if(useKV) await (await kv()).set('site-config', cfg);
  else { await fs.mkdir(path.dirname(FILE), { recursive:true }); await fs.writeFile(FILE, JSON.stringify(cfg, null, 2)); }
  delete C.site; return cfg;
}
export async function resetSite(){
  if(useKV) await (await kv()).del('site-config'); else await fs.rm(FILE, { force:true });
  delete C.site; return normalizeSite(null);
}

// ตัวเลขจริงจากระบบ (แคช 60 วิ — listVaults ดึงทุกลิงก์ ไม่ควรรันทุกครั้งที่มีคนเปิดหน้าแรก)
export const rawCounts = ({ fresh = false } = {}) => { if(fresh) delete C.raw; return memo('raw', 60000, async () => {
  const [vs, ks, gs] = await Promise.all([listVaults().catch(() => []), listKeys().catch(() => []), allGames().catch(() => [])]), now = Date.now();
  return { views:vs.reduce((a, v) => a + (v.views || 0), 0), links:vs.length, owners:new Set(vs.map(v => v.owner_id)).size,
    keys:ks.filter(k => !k.revoked && !(k.exp && now > k.exp)).length, maps:gs.length };
}); };
export const resolveStats = (cfg, raw) => cfg.stats.filter(s => s.show).map(s => ({ id:s.id, label:s.label, unit:s.unit, icon:s.icon, value:statValue(s, raw) }));
// สำหรับหน้าแรก (เซิร์ฟเวอร์เรนเดอร์)
export async function publicSite(){
  const cfg = await getSite();
  return { cfg, vars:themeVars(cfg), stats:cfg.showStats ? resolveStats(cfg, await rawCounts()) : [] };
}
