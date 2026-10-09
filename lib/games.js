import { getGameOverrides } from './gameConfig';
const GH = 'https://raw.githubusercontent.com/LoaderHub1990';
const LIST = [
  [142823291,'MM2','Script-all/refs/heads/main/SRC%20MM2'],
  [93978595733734,'ViolenceDistrict','OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20ViolenceDistrict'],
  [4924922222,'Brookhaven RP','OBF-SRC-PRO-MAX/refs/heads/main/OBF%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%9A%E0%B8%B8%E0%B9%8A%E0%B%84'],
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
  [4777817887,'Blade Ball','OBF-SRC-PRO-MAX/refs/heads/main/Blade%20Ball%20V2'],
  [0,'BlockSpin 🔪','OBF-SRC-PRO-MAX/refs/heads/main/Blockspin'],
];
const full = u => /^https?:\/\//i.test(u) ? u : `${GH}/${u}`;
const slug = (n, fallback) => String(n).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || fallback;
const q = s => JSON.stringify(String(s));
export const DEFAULT_GAME = { id:'default', name:'ALL MENU', url:`${GH}/OBF-SRC-PRO-MAX/refs/heads/main/F!exozy%20X%20%7C%20128b!t%20Hub`, placeIds:[], aliases:[] };
export const BLADE_BALL_GAME_ID = 4777817887;
export const BLADE_BALL = { id:'blade-ball', name:'Blade Ball', url:full('OBF-SRC-PRO-MAX/refs/heads/main/Blade%20Ball%20V2') };
export const BLOCKSPIN = { id:'blockspin', name:'BlockSpin 🔪', url:full('OBF-SRC-PRO-MAX/refs/heads/main/Blockspin') };
function defaults(){ return LIST.filter(x=>x[0]!==4777817887 && x[0]!==0).map(([pid,name,url])=>({id:slug(name,'game-'+pid),name,url:full(url),placeIds:[String(pid)],aliases:[]})); }
export async function allGames(){
  const saved=await getGameOverrides();
  const source=saved.length ? saved : defaults();
  const out=source.map(g=>({...g,url:g.url||''}));
  if(!out.some(g=>g.id==='blade-ball')) out.push({...BLADE_BALL,placeIds:[],aliases:['blade ball']});
  if(!out.some(g=>g.id==='blockspin')) out.push({...BLOCKSPIN,placeIds:[],aliases:['block spin']});
  return out;
}
export async function scriptUrlById(id){ const g=(await allGames()).find(x=>x.id===id); return g?.url || (id==='default'?DEFAULT_GAME.url:null); }
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
export async function resolveScriptId(universeId,placeId,gameName=''){
  const games=await allGames();
  const u=Number(universeId), p=Number(placeId);
  if(u===BLADE_BALL_GAME_ID) return 'blade-ball';
  const byId=games.find(g=>(g.placeIds||[]).some(id=>Number(id)===p || Number(id)===u));
  if(byId) return byId.id;
  const name=norm(gameName);
  if(name){ const byName=games.find(g=>[g.name,...(g.aliases||[])].some(n=>{const a=norm(n);return a && (name===a || name.includes(a) || a.includes(name));})); if(byName) return byName.id; }
  return DEFAULT_GAME.id;
}
export async function stubGamesLua(){
  const games=await allGames(), rows=[];
  for(const g of games) for(const pid of g.placeIds||[]) rows.push(`    [${Number(pid)}] = ${q(g.id)},`);
  return rows.join('\n');
}

export async function sourceHubGamesLua(hidden=false){
  const games=await allGames();
  const rows=games.filter(g=>g.name).map(g=>{
    const ids=(g.placeIds||[]).map(x=>Number(x)).filter(x=>Number.isFinite(x)&&x>0);
    const pid=ids[0]||0;
    const aliases=[...(g.aliases||[])];
    const url=hidden?`fx:${g.id}`:(g.url||'');
    return `    {Title=${q(g.name)},PlaceId=${pid},PlaceIds={${ids.join(',')}},Aliases={${aliases.map(q).join(',')}},Url=${q(url)},Id=${q(g.id)}},`;
  });
  rows.push(`    {Title=${q(DEFAULT_GAME.name)},PlaceId=0,PlaceIds={},Aliases={},Url=${q(hidden?'fx:default':DEFAULT_GAME.url)},Id=${q(DEFAULT_GAME.id)}},`);
  return `local GAMES = {\n${rows.join('\n')}\n}`;
}

export async function sourceGamesLua(hidden=false){
  const games=await allGames();
  const entry=g=>`{Name=${q(g.name)},URL=${q(hidden?'fx:'+g.id:g.url)}}`;
  const rows=games.filter(g=>g.url).map(g=>`    [${q(g.id)}]=${entry(g)},`).join('\n');
  return `local SCRIPTS = {\n${rows}\n    [${q(DEFAULT_GAME.id)}]=${entry(DEFAULT_GAME)}\n}\n`+
    `local BLADE_BALL_GAME_ID = ${BLADE_BALL_GAME_ID}\n`+
    `local BLADE_BALL = ${entry(games.find(g=>g.id==='blade-ball')||BLADE_BALL)}\n`+
    `local BLOCKSPIN = ${entry(games.find(g=>g.id==='blockspin')||BLOCKSPIN)}\n`;
}
