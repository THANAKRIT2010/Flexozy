import { discordLogin } from '@/lib/auth';
import { clientIp } from '@/lib/net';
export const dynamic = 'force-dynamic';
// จำกัดการกดเข้าสู่ระบบต่อ IP (20 ครั้ง / 5 นาที) ในหน่วยความจำของ instance — กันยิงวนเปลี่ยนเส้นทาง OAuth โดยไม่เสียคำสั่ง KV
const M = globalThis.__fxLogin ||= new Map();
export async function GET(req){
  const ip = clientIp(req) || 'x', now = Date.now(), r = M.get(ip);
  if(!r || r.t < now) M.set(ip, { n:1, t:now + 300000 });
  else if(++r.n > 20) return new Response('Too many requests', { status:429, headers:{ 'Retry-After':'300', 'Cache-Control':'no-store' } });
  if(M.size > 5000) M.clear();
  return discordLogin();
}
