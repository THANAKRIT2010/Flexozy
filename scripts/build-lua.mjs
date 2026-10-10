// แปลง lua/hub.lua → lib/hubLua.js (ฝังเป็นสตริง) — รัน: npm run build:lua
import fs from 'fs';
const src = fs.readFileSync(new URL('../lua/hub.lua', import.meta.url), 'utf8');
if(src.includes('`') || src.includes('${')) { console.error('hub.lua ห้ามมี backtick หรือ ${ (ชนกับ template literal)'); process.exit(1); }
for(const t of ['--@@KEYED@@','--@@KEYLINK@@','--@@SUPPORTLINK@@','--@@DISCORDCODE@@','--@@GAMES@@','--@@FXAPI@@'])
  if(!src.includes(t)) { console.error('ขาด placeholder ' + t); process.exit(1); }
fs.writeFileSync(new URL('../lib/hubLua.js', import.meta.url), '// สร้างอัตโนมัติจาก lua/hub.lua ด้วย `npm run build:lua` — อย่าแก้ไฟล์นี้ตรง ๆ\nexport const HUB_LUA = String.raw`' + src + '`;\n');
console.log('lib/hubLua.js ←', src.split('\n').length, 'บรรทัด');
