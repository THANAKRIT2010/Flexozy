import { hubGamesLua } from './games';
import { fxApiLua } from './keyLua';
import { luaStr } from './luaStr';
import { HUB_LUA } from './hubLua';
// ตัวหลักของ hub (UI เหมือน lua/hub.lua ทุกอย่าง) — ฝังตารางเกม + โค้ด key API ตอนส่ง
// REQUIRE_KEY_HUB: ค่าเริ่มต้น "เปิด" (ปลอดภัย) — ซ่อน URL สคริปต์ทุกแมพ + ต้องมี key ที่ผ่านเซิร์ฟเวอร์; ตั้ง REQUIRE_KEY_HUB=0 เพื่อปิด (โหมดเปิด ไม่มีหน้า login และ URL สคริปต์เห็นได้)
export const hubKeyed = () => process.env.REQUIRE_KEY_HUB !== '0';
const INVITE = () => (process.env.DISCORD_INVITE || 'WFUejxeggt').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'WFUejxeggt';
export const buildLoader = async () => {
  const keyed = hubKeyed(), games = await hubGamesLua(keyed), link = 'https://discord.gg/' + INVITE();
  const keyLink = process.env.KEY_LINK && /^https:\/\//.test(process.env.KEY_LINK) ? process.env.KEY_LINK : link;
  return HUB_LUA
    .replace('--@@KEYED@@', () => String(keyed)).replace('--@@KEYLINK@@', () => luaStr(keyLink)).replace('--@@SUPPORTLINK@@', () => luaStr(link))
    .replace('--@@DISCORDCODE@@', () => luaStr(INVITE()))
    .replace('--@@GAMES@@', () => games).replace('--@@FXAPI@@', () => keyed ? fxApiLua() : 'local FxApi = {}');
};
