import { checkChallenge, POW_ZEROS } from './pass';
import { claimNonce } from './db';
import { turnstileConfigured, siteverify } from './turnstileCore';
export { turnstileConfigured };
// ตรวจว่า "เป็นคน" — Turnstile ก่อน ถ้า Cloudflare ใช้ไม่ได้ (ไม่ได้ตั้งค่า / ถูกบล็อก / ล่ม) → ใช้ proof-of-work ของเราเองแทน
// ตั้ง TURNSTILE_STRICT=1 ถ้าต้องการบังคับ Turnstile อย่างเดียว (ไม่มีทางสำรอง)
async function powOk(pow){
  if(!pow || !await checkChallenge(pow.c, pow.n, POW_ZEROS)) return false;
  return claimNonce('pow:'+String(pow.c).slice(0,16), 330); // ใช้โจทย์ได้ครั้งเดียว
}
// body: { turnstile?: token, pow?: {c,n} }
export async function verifyHuman(body, ip){
  const strict = process.env.TURNSTILE_STRICT === '1';
  if(turnstileConfigured() && body?.turnstile){
    const r = await siteverify(String(body.turnstile), ip);
    if(r === 'ok') return { ok:true };
    if(r === 'failed' || strict) return { ok:false, error:'turnstile_failed' };
  }else if(turnstileConfigured() && strict){
    return { ok:false, error:'turnstile_required' };
  }
  if(await powOk(body?.pow)) return { ok:true };
  return { ok:false, error: turnstileConfigured() ? 'turnstile_required' : 'pow_required' };
}
