import crypto from 'crypto';
// "ซีล" ซอสของ /loader — ใครเอา game:HttpGet(".../loader") ไป print/เขียนไฟล์จะเห็นแค่ตัวถอดรหัสสั้น ๆ + ข้อมูลที่ถูกสลับ (ไม่เห็นโดเมน token ตารางเกม หรือ logic)
// ข้อจำกัดที่ต้องรู้: ตัวถอดรหัสต้องส่งไปกับข้อมูลเสมอ ผู้โจมตีที่เก่งยังถอดเองได้ — ชั้นนี้แค่กันการ dump ง่าย ๆ ส่วนของที่ "ใช้ได้จริง" ถูกกันด้วย
//   token ผูก IP + ใช้ครั้งเดียว (lib/bootToken.js), ตัวนับ loader ที่ไม่ถูกใช้ (lib/loaderProtection.js) และ guardLua ที่เตะคนฮุก loadstring ก่อนถอดรหัส
export const sealOn = () => process.env.ANTI_DUMP_SEAL !== '0';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const DECODER = String.raw`local __K = "--@@KEY@@"
local __D = "--@@DATA@@"
local __T = {}
for i = 1, 64 do __T[string.byte("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", i)] = i - 1 end
local __o, __acc, __bits, __j, __kl = {}, 0, 0, 0, #__K
for i = 1, #__D do
    local v = __T[string.byte(__D, i)]
    if v then
        __acc = __acc * 64 + v
        __bits = __bits + 6
        if __bits >= 8 then
            __bits = __bits - 8
            local x = math.floor(__acc / 2 ^ __bits)
            __acc = __acc % 2 ^ __bits
            __j = __j + 1
            __o[__j] = string.char(bit32.bxor(x, string.byte(__K, (__j - 1) % __kl + 1), (__j * 7) % 256))
        end
    end
end
local __f = loadstring(table.concat(__o))
if __f then return __f() end
`;
export function seal(plain){
  const key = crypto.randomBytes(12).toString('hex'), src = Buffer.from(plain, 'utf8'), out = Buffer.alloc(src.length);
  for(let i = 0; i < src.length; i++) out[i] = src[i] ^ key.charCodeAt(i % key.length) ^ (((i + 1) * 7) % 256);
  // ข้อความภาษาไทย/UTF-8 หลายไบต์: string.char ทำงานเป็นไบต์ จึงถอดได้ถูกต้องเมื่อ loadstring อ่านเป็นไบต์เดิม
  return DECODER.replace('--@@KEY@@', () => key).replace('--@@DATA@@', () => out.toString('base64'));
}
export { B64 };
