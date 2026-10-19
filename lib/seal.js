import crypto from 'crypto';
// "ซีล" ซอสของ /loader และลิงก์ทั่วไป — ใครเอา game:HttpGet(...) ไป print/เขียนไฟล์จะเห็นแค่ตัวถอดรหัสสั้น ๆ + ข้อมูลที่ถูกสลับ
// (ไม่เห็นโดเมน token ตารางเกม guard หรือ logic ใด ๆ — ตั้งแต่ v12 ตัว guard เองก็อยู่ในก้อนที่ถูกซีลด้วย ไม่มี Lua อ่านได้หลงเหลือส่งออกเลย)
// v12: ตัวถอดรหัส "สุ่มใหม่ทุกครั้ง" — ชื่อตัวแปร + ตารางสลับอักษร (ไม่ใช่ base64 มาตรฐาน) เปลี่ยนทุกคำขอ
//   กันการจับลายเซ็นแบบ static (เทียบ response สองครั้งแล้วเจอโครงสร้าง/ค่าคงที่ซ้ำเดิม ก็ยังสรุปว่าเป็น "ตัวถอดรหัสของ Flexozy" ไม่ได้)
// ข้อจำกัดที่ต้องรู้: ตัวถอดรหัสต้องส่งไปกับข้อมูลเสมอ (ไม่งั้นรันไม่ได้) ผู้โจมตีที่เก่งพอยังถอดเองได้เสมอ — ชั้นนี้แค่กันการ dump ง่าย ๆ / การสแกนหาลายเซ็นอัตโนมัติ
//   ส่วนของที่ "ใช้ได้จริง" ถูกกันด้วย token ผูก IP+ใช้ครั้งเดียว, proof-of-execution, ตัวนับการดึงซ้ำ (lib/loaderProtection.js) และ guard ที่เตะคนฮุกก่อนถอดรหัส
export const sealOn = () => process.env.ANTI_DUMP_SEAL !== '0';
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

export function seal(plain){
  const key = crypto.randomBytes(12).toString('hex'), src = Buffer.from(plain, 'utf8'), out = Buffer.alloc(src.length);
  for(let i = 0; i < src.length; i++) out[i] = src[i] ^ key.charCodeAt(i % key.length) ^ (((i + 1) * 7) % 256);
  const alpha = shuffledAlphabet();
  // แปลง base64 มาตรฐานของ Node ให้ใช้ชุดอักษรที่สลับแล้ว (ตำแหน่งเดียวกับ STD → alpha) ตัด '=' ทิ้ง (decoder ข้ามอักขระที่ไม่รู้จักอยู่แล้ว)
  const std2custom = Object.fromEntries([...STD].map((c, i) => [c, alpha[i]]));
  const data = out.toString('base64').replace(/=+$/, '').split('').map(c => std2custom[c] ?? c).join('');
  const [K, D, T, O, ACC, BITS, J, KL, F, I, V, X] = names(12);
  // ตัวถอดรหัส (ไม่มีคำใบ้ว่าเป็นของ Flexozy): โหลดตาราง 64 อักษรแบบสุ่ม → base64-variant decode → XOR ด้วยคีย์ → loadstring
  const DECODER = `local ${K}="${key}"\nlocal ${D}="${data}"\nlocal ${T}={}\nfor ${I}=1,64 do ${T}[string.byte("${alpha}",${I})]=${I}-1 end\n` +
    `local ${O},${ACC},${BITS},${J},${KL}={},0,0,0,#${K}\n` +
    `for ${I}=1,#${D} do local ${V}=${T}[string.byte(${D},${I})] if ${V} then ${ACC}=${ACC}*64+${V} ${BITS}=${BITS}+6 ` +
    `if ${BITS}>=8 then ${BITS}=${BITS}-8 local ${X}=math.floor(${ACC}/2^${BITS}) ${ACC}=${ACC}%2^${BITS} ${J}=${J}+1 ` +
    `${O}[${J}]=string.char(bit32.bxor(${X},string.byte(${K},(${J}-1)%${KL}+1),(${J}*7)%256)) end end end\n` +
    `local ${F}=loadstring(table.concat(${O}))\nif ${F} then return ${F}() end\n`;
  return DECODER;
}
