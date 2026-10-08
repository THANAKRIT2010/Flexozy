// ระบบ "ใบผ่านทาง" หลังยืนยันว่าไม่ใช่บอต — ใช้ได้ทั้ง middleware และ route แบบ edge (ห้าม import อะไรที่เป็น Node-only)
// ต้องตั้ง SESSION_SECRET ใน ENV (ถ้าไม่ตั้งบน production ระบบจะสุ่มค่าเองต่อ instance → ใบผ่านทางอาจใช้ไม่ได้ข้ามเซิร์ฟเวอร์)
const enc = new TextEncoder();
const RAND = Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,'0')).join('');
const secret = () => process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET || (process.env.NODE_ENV==='production' ? RAND : 'dev_secret_change_me');
const b64u = (buf) => { let s=''; for(const x of new Uint8Array(buf)) s+=String.fromCharCode(x); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
async function hmac(msg){
  const k = await crypto.subtle.importKey('raw', enc.encode('pass:'+secret()), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(msg))).slice(0,32);
}
async function sha256hex(s){ return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), x=>x.toString(16).padStart(2,'0')).join(''); }
const eq = (a,b) => { if(a.length!==b.length) return false; let r=0; for(let i=0;i<a.length;i++) r|=a.charCodeAt(i)^b.charCodeAt(i); return r===0; };
const uaKey = async (ua) => (await sha256hex(String(ua))).slice(0,16);

export const PASS_COOKIE = 'fx_pass', PASS_TTL = 12*3600; // วินาที
export const POW_ZEROS = 4; // ตัวอักษร hex นำหน้าที่ต้องเป็น 0 (≈65k แฮช ใช้เวลาราว 1 วิ ในเบราว์เซอร์)

// ใบผ่านทาง = เวลาหมดอายุ + ลายเซ็นที่ผูกกับ User-Agent (ขโมย cookie ไปใช้กับเครื่องมืออื่นไม่ได้)
export async function makePass(ua){ const exp = Date.now()+PASS_TTL*1000; return `${exp}.${await hmac(`pass|${exp}|${await uaKey(ua)}`)}`; }
export async function checkPass(v, ua){
  const m = /^(\d{13})\.([A-Za-z0-9_-]{32})$/.exec(String(v||'')); if(!m || Number(m[1]) < Date.now()) return false;
  return eq(m[2], await hmac(`pass|${m[1]}|${await uaKey(ua)}`));
}
export const passCookie = (val) => `${PASS_COOKIE}=${val}; Path=/; Max-Age=${PASS_TTL}; HttpOnly; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`;

// โจทย์: เซิร์ฟเวอร์เซ็น challenge (อายุ 5 นาที) → เบราว์เซอร์ต้องหาเลข n ที่ sha256(`${challenge}:${n}`) ขึ้นต้นด้วย 0000
export async function makeChallenge(){
  const n = Array.from(crypto.getRandomValues(new Uint8Array(8)), b=>b.toString(16).padStart(2,'0')).join(''), exp = Date.now()+300000;
  return `${n}.${exp}.${await hmac(`ch|${n}|${exp}`)}`;
}
export async function checkChallenge(c, n){
  const m = /^([0-9a-f]{16})\.(\d{13})\.([A-Za-z0-9_-]{32})$/.exec(String(c||'')); if(!m || Number(m[2]) < Date.now()) return false;
  if(!eq(m[3], await hmac(`ch|${m[1]}|${m[2]}`))) return false;
  if(!/^\d{1,9}$/.test(String(n))) return false;
  return (await sha256hex(`${c}:${n}`)).startsWith('0'.repeat(POW_ZEROS));
}
