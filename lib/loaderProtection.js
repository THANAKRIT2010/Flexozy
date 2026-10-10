import { forbidden } from './bots';
import { hit } from './db';
import { clientIp } from './net';
// จำกัดความถี่ต่อ IP ของ endpoint ที่ executor เรียก (นับใน KV ถ้ามี ไม่งั้นนับในหน่วยความจำของ instance)
const LIMITS = { '/loader':20, '/bootstrap-source':24, '/bootstrap-info':60, '/game-script':30 };
export async function protectLoaderRequest(req, pathname = new URL(req.url).pathname){
  const key = Object.keys(LIMITS).find(p => pathname === p || (p === '/game-script' && pathname.startsWith('/game-script/')));
  if(!key) return null;
  const ip = clientIp(req);
  if(!ip && process.env.NODE_ENV === 'production') return forbidden();
  return (await hit(`ldr:${key}:${ip||'local'}`, 60)) > LIMITS[key] ? forbidden() : null;
}
