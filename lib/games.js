// ============================================================
//  เพิ่มเเมพ: เติมอีก 1 บรรทัดในรายการข้างล่าง แล้ว deploy  (ผู้ใช้ทุกคนได้ของใหม่ทันที)
//
//      [PlaceId,   'ชื่อที่โชว์ใน GUI',   'ลิงก์สคริปต์'],
//
//  - หลาย PlaceId ใช้สคริปต์เดียวกัน:  [[111, 222, 333], 'ชื่อ', 'ลิงก์'],
//  - ลิงก์ใส่แค่ส่วนท้ายของ GitHub LoaderHub1990 ก็ได้ เช่น 'OBF-SRC-PRO-MAX/refs/heads/main/Rivals'
//    หรือใส่ลิงก์เต็ม (https://...) ของที่ไหนก็ได้
// ============================================================
const GH = 'https://raw.githubusercontent.com/LoaderHub1990';

const LIST = [
  [142823291,       'MM2',                       'Script-all/refs/heads/main/SRC%20MM2'],
  [93978595733734,  'ViolenceDistrict',          'OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20ViolenceDistrict'],
  [4924922222,      'Brookhaven RP',             'OBF-SRC-PRO-MAX/refs/heads/main/OBF%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%9A%E0%B8%B8%E0%B9%8A%E0%B8%84'],
  [537413528,       'Build a boat',              'OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20Build%20a%20boat'],
  [4503309821,      'City Thailand 2 Auto sell', 'OBF-SCRIPT-ALL/refs/heads/main/F!exozy%20City%20Thailand%202%20Auto%20sell'],
  [107778070777162, 'Steal An Egg',              'OBF-SCRIPT-ALL/refs/heads/main/Steal%20An%20Egg%20OBF%20V2'],
  [124216119978534, 'Ride A Pet',                'OBF-SRC-PRO-MAX/refs/heads/main/Ride%20A%20Pet%20%E0%B8%A1%E0%B8%B5%E0%B8%84%E0%B8%B5%E0%B8%A2%E0%B9%8C'],
  [126870639873289, 'Jump for Animals! 🐾',      'OBF-SRC-PRO-MAX/refs/heads/main/Jump%20for%20Animals'],
  [17625359962,     'RIVALS',                    'OBF-SRC-PRO-MAX/refs/heads/main/Rivals'],
  [662417684,       'LUCKY BLOCKS',              'OBF-SRC-PRO-MAX/refs/heads/main/LUCKY%20BLOCKS'],
  [79602128065352,  'Doomspire Brickbattle',     'OBF-SRC-PRO-MAX/refs/heads/main/Doomspire%20Brickbattle'],
  [84556640895285,  'Deagle Arena',              'OBF-SRC-PRO-MAX/refs/heads/main/Deagle%20Arena'],
  [12355337193,     'MVSD',                      'OBF-SRC-PRO-MAX/refs/heads/main/MVSD'],

  // ↓ เพิ่มเเมพของคุณต่อตรงนี้
];

// ---------- ด้านล่างนี้ไม่ต้องแก้ ----------
const full = (u) => /^https?:\/\//.test(u) ? u : `${GH}/${u}`;
const slug = (n, fallback) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;

// PlaceId → { id, name, url }
export const GAMES = {};
for (const [ids, name, url] of LIST) {
  const list = [].concat(ids);
  const id = slug(name, 'game-' + list[0]);
  for (const pid of list) GAMES[pid] = { id, name, url: full(url) };
}

// เกมที่ไม่อยู่ในรายการ → ALL MENU
export const DEFAULT_GAME = { id:'default', name:'ALL MENU',
  url:`${GH}/OBF-SRC-PRO-MAX/refs/heads/main/F!exozy%20X%20%7C%20128b!t%20Hub` };

// ตรวจจาก GameId (Universe) / ชื่อแมพ แทน PlaceId
export const BLADE_BALL_GAME_ID = 4777817887;
export const BLADE_BALL = { id:'blade-ball', name:'Blade Ball',   url:`${GH}/OBF-SRC-PRO-MAX/refs/heads/main/Blade%20Ball%20V2` };
export const BLOCKSPIN  = { id:'blockspin',  name:'BlockSpin 🔪', url:`${GH}/OBF-SRC-PRO-MAX/refs/heads/main/Blockspin` };

const q = (s) => JSON.stringify(String(s));
// hidden = ไม่ฝัง URL จริงลงใน loader (ใช้ "fx:ID" แทน → loader ขอซอสผ่าน /game-script ด้วย key)
let HIDE = false;
const entry = (g) => `{Name=${q(g.name)},URL=${q(HIDE ? 'fx:'+g.id : g.url)}}`;
export const scriptUrlById = (id) => [...Object.values(GAMES), DEFAULT_GAME, BLADE_BALL, BLOCKSPIN].find(g => g.id === id)?.url || null;

// scriptId จาก PlaceId / UniverseId (ใช้ใน /bootstrap-info) — ไม่เจอ = "default"
export function resolveScriptId(universeId, placeId){
  if(Number(universeId) === BLADE_BALL_GAME_ID) return BLADE_BALL.id;
  return GAMES[Number(placeId)]?.id || GAMES[Number(universeId)]?.id || DEFAULT_GAME.id;
}

// ตาราง PlaceId → scriptId ที่ฝังใน stub (/loader)
export function stubGamesLua(){
  return Object.entries(GAMES).map(([pid, g]) => `    [${Number(pid)}] = ${q(g.id)},`).join('\n');
}

// ตาราง scriptId → {Name,URL} ที่ฝังใน /bootstrap-source
export function sourceGamesLua(hidden=false){
  HIDE = hidden;
  const rows = [...new Map(Object.values(GAMES).map(g => [g.id, g])).values()].map(g => `    [${q(g.id)}]=${entry(g)},`).join('\n');
  return `local SCRIPTS = {\n${rows}\n    [${q(DEFAULT_GAME.id)}]=${entry(DEFAULT_GAME)}\n}\n`
    + `local BLADE_BALL_GAME_ID = ${BLADE_BALL_GAME_ID}\n`
    + `local BLADE_BALL = ${entry(BLADE_BALL)}\n`
    + `local BLOCKSPIN = ${entry(BLOCKSPIN)}\n`;
}
