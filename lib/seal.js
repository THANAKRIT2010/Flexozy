import crypto from 'crypto';
// "ซีล" ซอสของ /loader และลิงก์ทั่วไป — ใครเอา game:HttpGet(...) ไป print/เขียนไฟล์จะเห็นแค่ตัวถอดรหัสสั้น ๆ + ข้อมูลที่ถูกสลับ
// (ไม่เห็นโดเมน token ตารางเกม guard หรือ logic ใด ๆ — ตั้งแต่ v12 ตัว guard เองก็อยู่ในก้อนที่ถูกซีลด้วย ไม่มี Lua อ่านได้หลงเหลือ)
// v12: ตัวถอดรหัส "สุ่มใหม่ทุกครั้ง" — ชื่อตัวแปร + ตารางสลับอักษร (ไม่ใช่ base64 มาตรฐาน) เปลี่ยนทุกคำขอ
//   กันการจับลายเซ็นแบบ static (เทียบ response สองครั้งแล้วเจอโครงสร้าง/ค่าคงที่ซ้ำเดิม ก็ยังสรุปว่าเป็น "ตัวถอดรหัสของ Flexozy" ไม่ได้)
// v22: คีย์สตรีม XOR เปลี่ยนจาก "คีย์วน + ไล่เลขบวก" (มีคาบซ้ำ) เป็น xorshift32 ยาวเท่าข้อมูล (คาบ > 4 พันล้าน ไม่ซ้ำจริงสำหรับสคริปต์ทั่วไป)
//   ตัดการวิเคราะห์แบบ "คีย์คาบสั้น" (เช่น หาคาบด้วย autocorrelation/Kasiski) ออกไปเกือบหมด + สลับลำดับ/แทรกบรรทัดหลอกในตัวถอดรหัสทุกครั้ง
// ข้อจำกัดที่ต้องรู้: ตัวถอดรหัสต้องส่งไปกับข้อมูลเสมอ (ไม่งั้นรันไม่ได้) ผู้โจมตีที่เก่งพอยังถอดเองได้เสมอ (เป็นไปตาม Kerckhoffs) —
//   ส่วนของที่ "ใช้ได้จริง" ถูกกันด้วย token ผูก IP+ใช้ครั้งเดียว, proof-of-execution, ตัวนับการดึงซ้ำ (lib/loaderProtection.js) และ guard ที่เตะคนฮุกฟังก์ชัน (lib/guard.js)
export const sealOn = () => process.env.ANTI_DUMP_SEAL !== '0';
// v13: ซีลซ้อน 2 ชั้น (ค่าเริ่มต้นเปิด) — DOUBLE_SEAL=0 เพื่อปิด ถ้ากังวลเรื่อง loadstring ซ้อนกันบนอุปกรณ์ล่างมาก ๆ (ภาระเพิ่มน้อยมากในทางปฏิบัติ)
export const doubleSeal = () => process.env.DOUBLE_SEAL !== '0';
const STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// ชื่อตัวแปรสุ่ม (2-4 ตัวอักษร, ไม่ชนกัน) — ต่างกันทุกครั้งที่เรียก seal()
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function names(n){
  const used = new Set(), out = [];
  while(out.length < n){
    let s = LETTERS[crypto.randomInt(52)];
    const len = 2 + crypto.randomInt(3);
    for(let i = 1; i < len; i++) s += LETTERS[crypto.randomInt(52)];
    if(!used.has(s)){ used.add(s); out.push('_' + s); }
  }
  return out;
}
// สลับตำแหน่งอักษร 64 ตัวของ base64 แบบสุ่ม (ชุดอักษรเดิม ตำแหน่งใหม่) — ไม่ใช่ตารางมาตรฐานที่จำได้ง่าย
function shuffledAlphabet(){
  const a = STD.split('');
  for(let i = a.length - 1; i > 0; i--){ const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a.join('');
}
const U32 = 0x100000000;
// xorshift32 — คีย์สตรีมยาวเท่าข้อมูล (ไม่วนซ้ำในทางปฏิบัติ) ทั้งฝั่งเข้ารหัส (Node, ใช้ BigInt ให้ตรง 32 บิตเป๊ะ) และถอดรหัส (Lua ใช้ bit32)
function xorStream(len, seed){
  let x = BigInt.asUintN(32, BigInt(seed) || 1n) || 1n;
  const out = Buffer.alloc(len);
  for(let i = 0; i < len; i++){
    x ^= BigInt.asUintN(32, x << 13n); x = BigInt.asUintN(32, x);
    x ^= x >> 17n;
    x ^= BigInt.asUintN(32, x << 5n); x = BigInt.asUintN(32, x);
    out[i] = Number(x & 0xffn);
  }
  return out;
}
// บรรทัดหลอก (ไม่มีผลต่อผลลัพธ์) — สุ่มรูปแบบ/ค่าทุกครั้ง แทรกสลับกับตัวถอดรหัสจริงเพื่อรบกวนการเทียบโครงสร้างแบบ static
function junkLines(nm, count){
  const out = [];
  for(let i = 0; i < count; i++){
    const n = nm[i], a = 2 + crypto.randomInt(9000), b = 3 + crypto.randomInt(9000), pick = crypto.randomInt(3);
    if(pick === 0) out.push(`local ${n}=(${a}*${b})%${1 + crypto.randomInt(251)}`);
    else if(pick === 1) out.push(`local ${n}=bit32.bxor(${a},${b})`);
    else out.push(`if (${a}%${b})==${a % b} then local ${n}=${a}-${b} end`);
  }
  return out;
}

export function seal(plain){
  const src = Buffer.from(plain, 'utf8');
  const seedBuf = crypto.randomBytes(4), seed = seedBuf.readUInt32BE(0) || 1;
  const stream = xorStream(src.length, seed), out = Buffer.alloc(src.length);
  for(let i = 0; i < src.length; i++) out[i] = src[i] ^ stream[i];
  const alpha = shuffledAlphabet();
  // แปลง base64 มาตรฐานของ Node ให้ใช้ชุดอักษรที่สลับแล้ว (ตำแหน่งเดียวกับ STD → alpha) ตัด '=' ทิ้ง (decoder ข้ามอักขระที่ไม่รู้จักอยู่แล้ว)
  const std2custom = Object.fromEntries([...STD].map((c, i) => [c, alpha[i]]));
  const data = out.toString('base64').replace(/=+$/, '').split('').map(c => std2custom[c] ?? c).join('');
  const [S, D, T, O, ACC, BITS, J, F, I, V, X, W] = names(12), jnm = names(2 + crypto.randomInt(4));
  const lines = [
    `local ${S}=${seed}`,
    `local ${D}="${data}"`,
    `local ${T}={}`,
    `for ${I}=1,64 do ${T}[string.byte("${alpha}",${I})]=${I}-1 end`,
    `local ${O},${ACC},${BITS},${J}={},0,0,0`,
    `local function ${W}() ${S}=bit32.bxor(${S},bit32.lshift(${S},13)) ${S}=bit32.bxor(${S},bit32.rshift(${S},17)) ${S}=bit32.bxor(${S},bit32.lshift(${S},5)) return bit32.band(${S},255) end`,
    `for ${I}=1,#${D} do local ${V}=${T}[string.byte(${D},${I})] if ${V} then ${ACC}=${ACC}*64+${V} ${BITS}=${BITS}+6 ` +
      `if ${BITS}>=8 then ${BITS}=${BITS}-8 local ${X}=bit32.band(math.floor(${ACC}/2^${BITS}),255) ${ACC}=${ACC}%2^${BITS} ${J}=${J}+1 ` +
      `${O}[${J}]=string.char(bit32.bxor(${X},${W}())) end end end`,
    `local ${F}=loadstring(table.concat(${O}))`,
    `if ${F} then return ${F}() end`,
  ];
  // แทรกบรรทัดหลอก 2-5 บรรทัดในตำแหน่งสุ่ม (ไม่แทรกก่อนบรรทัดแรกหรือหลังบรรทัดสุดท้าย เพื่อไม่กระทบลำดับที่ต้องมาก่อน-หลังจริง)
  const junk = junkLines(jnm, jnm.length);
  for(const j of junk){ const pos = 1 + crypto.randomInt(lines.length - 1); lines.splice(pos, 0, j); }
  return lines.join('\n') + '\n';
}
