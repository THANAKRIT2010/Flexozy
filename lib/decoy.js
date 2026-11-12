import crypto from 'crypto';
// v23: "สคริปต์หลอก" — ส่งแทนสคริปต์จริงที่ /stage เมื่อ IP ดูเหมือนบอทไล่เส้นทาง/ดึงโค้ดของคนอื่นหลายคนรัว ๆ (ดู traceRisk ใน lib/db.js)
// หน้าตาเหมือนสคริปต์ฮับทั่วไปที่ใช้งานได้จริง (มีเมนู มีลิสต์ฟีเจอร์ มีข้อความ "โหลดสำเร็จ") แต่ทุกปุ่ม/ทุกสวิตช์ไม่ทำอะไรเลย
// ไม่มีการเรียก HttpGet ออกไปที่ไหนทั้งสิ้น (กันไม่ให้ไปดึงโค้ดคนอื่นมาเพิ่ม หรือทำให้เครื่องของเหยื่อ/บอทไปแตะปลายทางอื่นโดยไม่ตั้งใจ)
// สุ่มชื่อตัวแปร + สุ่มเลือกรายชื่อฟีเจอร์ + สุ่มลำดับทุกครั้งที่เรียก เพื่อไม่ให้เทียบ hash แล้วรู้ว่าเป็นของปลอมที่ส่งซ้ำ
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function rname(){ let s = LETTERS[crypto.randomInt(52)]; for(let i = 1; i < 3 + crypto.randomInt(3); i++) s += LETTERS[crypto.randomInt(52)]; return '_' + s; }
const pick = (arr, n) => { const a = [...arr]; for(let i = a.length - 1; i > 0; i--){ const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const FEATS = ['Auto Farm', 'Infinite Jump', 'Speed Boost', 'ESP Players', 'Auto Collect', 'Anti AFK', 'Walk Speed', 'No Clip', 'Auto Rejoin', 'Server Hop', 'Fly', 'God Mode'];
const TITLES = ['Universal Hub', 'Premium Script Hub', 'All-In-One Hub', 'Game Utility Hub'];
export function decoyScript(){
  const n = 5 + crypto.randomInt(4), feats = pick(FEATS, n), title = pick(TITLES, 1)[0];
  const [W, OK, F, I, NAME, CB] = [rname(), rname(), rname(), rname(), rname(), rname()];
  const lines = [
    'task.spawn(function()',
    `local ${OK} = pcall(function()`,
    `  local ${W} = {}`,
    `  ${W}.Title = "${title}"`,
    `  ${W}.Features = {}`,
    `  local ${F} = {${feats.map(f => `"${f}"`).join(', ')}}`,
    `  for ${I} = 1, #${F} do`,
    `    local ${NAME} = ${F}[${I}]`,
    `    local ${CB} = function() end`,
    `    ${W}.Features[${NAME}] = ${CB}`,
    '  end',
    '  pcall(function()',
    '    game:GetService("StarterGui"):SetCore("SendNotification", {',
    `      Title = "${title}",`,
    '      Text = "โหลดสำเร็จ · พร้อมใช้งาน",',
    '      Duration = 4',
    '    })',
    '  end)',
    `  return ${W}`,
    'end)',
    `if not ${OK} then return end`,
    'end)',
  ];
  return lines.join('\n') + '\n';
}
