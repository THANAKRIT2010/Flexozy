import { forbidden } from './bots';
import { hit, peek, decr, flag, isFlagged, logSec } from './db';
import { clientIp } from './net';
// จำกัดความถี่ต่อ IP ของ endpoint ที่ executor เรียก (นับใน KV ถ้ามี ไม่งั้นนับในหน่วยความจำของ instance)
const LIMITS = { '/loader':20, '/bootstrap-source':24, '/bootstrap-info':60, '/game-script':30 };
// v10: ตรวจพฤติกรรม "ดึง /loader แล้วไม่เอา token ไปใช้" — ผู้ใช้จริงดึง /loader แล้วเรียก /bootstrap-source ต่อทุกครั้ง ส่วนคนที่ dump (HttpGet + print) จะดึงซ้ำ ๆ โดยไม่เคยใช้ token
const DEBT_MAX = () => Math.max(3, Number(process.env.LOADER_DEBT_MAX) || 10);   // ดึงเกินที่ใช้ได้กี่ครั้งใน 10 นาที
const BAN_SEC = () => Math.max(60, Number(process.env.LOADER_BAN_SEC) || 900);   // แบนกี่วินาที (ค่าเริ่มต้น 15 นาที)
export async function protectLoaderRequest(req, pathname = new URL(req.url).pathname){
  const key = Object.keys(LIMITS).find(p => pathname === p || (p === '/game-script' && pathname.startsWith('/game-script/')));
  if(!key) return null;
  const ip = clientIp(req);
  if(!ip && process.env.NODE_ENV === 'production') return forbidden();
  if(await isFlagged('ban:' + (ip || 'local'))) return forbidden();
  return (await hit(`ldr:${key}:${ip||'local'}`, 60)) > LIMITS[key] ? forbidden() : null;
}
// เรียกตอน /loader ออก token → นับเป็น "หนี้" 1 ครั้ง; เกินเกณฑ์ = แบนชั่วคราว + บันทึก log (คืน true = ควรปฏิเสธคำขอนี้)
export async function noteLoaderIssued(req){
  const ip = clientIp(req) || 'local';
  const debt = await hit('ldrdebt:' + ip, 600);
  if(debt > DEBT_MAX()){ await flag('ban:' + ip, BAN_SEC()); await logSec('dump_suspect', ip, `ดึง /loader ${debt} ครั้งโดยไม่ใช้ token`); return true; }
  return false;
}
// เรียกตอน /bootstrap-source รับ token สำเร็จ → ล้างหนี้ 1 ครั้ง
export const noteLoaderRedeemed = (req) => decr('ldrdebt:' + (clientIp(req) || 'local'));
export const debtOf = (ip) => peek('ldrdebt:' + ip);
