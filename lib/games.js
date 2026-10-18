import { getGameOverrides } from './gameConfig';
import { luaStr } from './luaStr';
const GH = 'https://raw.githubusercontent.com/LoaderHub1990';
// [PlaceId(หรือ UniverseId), ชื่อ, path] — ค่าเริ่มต้นเมื่อแอดมินยังไม่เคยบันทึกในหลังบ้าน
const LIST = [
  [142823291,'MM2','Script-all/refs/heads/main/SRC%20MM2'],
  [93978595733734,'ViolenceDistrict','OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20ViolenceDistrict'],
  [4924922222,'Brookhaven RP','OBF-SRC-PRO-MAX/refs/heads/main/OBF%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%9A%E0%B8%B8%E0%B9%8A%E0%B8%84'], // แก้บั๊ก: เดิมตัด %B8 หายทำให้ URL พัง โหลดไม่ได้
  [537413528,'Build a boat','OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20Build%20a%20boat'],
  [4503309821,'City Thailand 2 Auto sell','OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20City%20Thailand%202%20Auto%20sell'],
  [107778070777162,'Steal An Egg','OBF-SCRIPT-ALL/refs/heads/main/Steal%20An%20Egg%20OBF%20V2'],
  [124216119978534,'Ride A Pet','OBF-SRC-PRO-MAX/refs/heads/main/Ride%20A%20Pet%20%E0%B8%A1%E0%B8%B5%E0%B8%84%E0%B8%B5%E0%B8%A2%E0%B9%8C'],
  [126870639873289,'Jump for Animals! 🐾','OBF-SRC-PRO-MAX/refs/heads/main/Jump%20for%20Animals'],
  [17625359962,'RIVALS','OBF-SRC-PRO-MAX/refs/heads/main/Rivals'],
  [662417684,'LUCKY BLOCKS','OBF-SRC-PRO-MAX/refs/heads/main/LUCKY%20BLOCKS'],
  [79602128065352,'Doomspire Brickbattle','OBF-SRC-PRO-MAX/refs/heads/main/Doomspire%20Brickbattle'],
  [84556640895285,'Deagle Arena','OBF-SRC-PRO-MAX/refs/heads/main/Deagle%20Arena'],
  [12355337193,'MVSD','OBF-SRC-PRO-MAX/refs/heads/main/MVSD'],
  [4777817887,'Blade Ball','OBF-SRC-PRO-MAX/refs/heads/main/Blade%20Ball%20V2'], // 4777817887 = Universe ID ของ Blade Ball (ระบบจับคู่ทั้ง PlaceId และ UniverseId)
  [0,'BlockSpin 🔪','OBF-SRC-PRO-MAX/refs/heads/main/Blockspin'],
];
const full = u => /^https?:\/\//i.test(u) ? u : `${GH}/${u}`;
const slug = (n, fallback) => String(n).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || fallback;
export const DEFAULT_GAME = { id:'default', name:'ALL MENU', url:`${GH}/OBF-SRC-PRO-MAX/refs/heads/main/F!exozy%20X%20%7C%20128b!t%20Hub`, placeIds:[], aliases:[] };
const EXTRA_ALIAS = { 'blade-ball':['blade ball'], 'blockspin':['block spin'] };
export const defaultGames = () => LIST.map(([pid,name,url]) => { const id = slug(name,'game-'+pid);
  return { id, name, url:full(url), placeIds: pid ? [String(pid)] : [], aliases: EXTRA_ALIAS[id] || [] }; });
// แก้บั๊ก: เดิมระบบยัด blade-ball / blockspin กลับเข้ามาทุกครั้งที่โหลด ทำให้แอดมินลบแมพสองตัวนี้ไม่ได้ — ตอนนี้ถ้าแอดมินเคยบันทึก จะใช้รายการที่บันทึกเท่านั้น
export async function allGames(){
  const saved = await getGameOverrides();
  return (Array.isArray(saved) && saved.length ? saved : defaultGames()).map(g => ({ ...g, url:g.url||'', placeIds:g.placeIds||[], aliases:g.aliases||[] }));
}
export async function scriptUrlById(id){ const g = (await allGames()).find(x => x.id === id); return g?.url || (id === 'default' ? DEFAULT_GAME.url : null); }
const norm = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
export async function resolveScriptId(universeId, placeId, gameName=''){
  const games = await allGames(), u = Number(universeId), p = Number(placeId);
  const byId = games.find(g => (g.placeIds||[]).some(id => Number(id) === p || Number(id) === u));
  if(byId) return byId.id;
  const name = norm(gameName);
  if(name){ const byName = games.find(g => [g.name, ...(g.aliases||[])].some(n => { const a = norm(n); return a && (name === a || name.includes(a) || a.includes(name)); })); if(byName) return byName.id; }
  return DEFAULT_GAME.id;
}
export async function stubGamesLua(){
  const rows = [];
  for(const g of await allGames()) for(const pid of g.placeIds||[]) if(Number(pid) > 0) rows.push(`    [${Number(pid)}] = ${luaStr(g.id)},`);
  return rows.join('\n');
}
// ตารางเกมที่ฝังใน hub (Lua) — hidden=true: ไม่ส่ง URL จริงให้ client ("fx:ID" แล้วให้เซิร์ฟเวอร์ดึงให้ผ่าน key)
export async function hubGamesLua(hidden){
  const rows = (await allGames()).filter(g => g.name).map(g => {
    const ids = (g.placeIds||[]).map(Number).filter(x => Number.isFinite(x) && x > 0);
    const url = hidden ? `fx:${g.id}` : (g.url||'');
    return `    {Title=${luaStr(g.name)},PlaceId=${ids[0]||0},PlaceIds={${ids.join(',')}},Aliases={${(g.aliases||[]).map(luaStr).join(',')}},Url=${luaStr(url)},Id=${luaStr(g.id)}},`;
  });
  rows.push(`    {Title=${luaStr(DEFAULT_GAME.name)},PlaceId=0,PlaceIds={},Aliases={},Url=${luaStr(hidden ? 'fx:default' : DEFAULT_GAME.url)},Id=${luaStr(DEFAULT_GAME.id)}},`);
  return `local GAMES = {\n${rows.join('\n')}\n}`;
}
