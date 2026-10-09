import { forbidden } from '@/lib/bots';
import { checkChallenge, makePass, passCookie } from '@/lib/pass';
import { verifyTurnstile } from '@/lib/turnstile';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
// รับคำตอบจากหน้าตรวจสอบความปลอดภัย → ถ้าผ่านจะออก cookie fx_pass (ผิดทุกกรณีตอบ 403 เหมือนกันหมด ไม่บอกว่าผิดตรงไหน)
export async function POST(req){
  let b; try{ b = await req.json() }catch{ return forbidden() }
  if(!b || b.f) return forbidden();                       // f = บิตธงที่ฝั่ง client ตรวจเจอว่าเป็น automation
  if(!await checkChallenge(b.c, b.n)) return forbidden(); // โจทย์ปลอม / หมดอายุ / แก้โจทย์ไม่ถูก
  if(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY){
    const ip = (req.headers.get('x-forwarded-for')||'').split(',')[0].trim();
    if(!(await verifyTurnstile(b.ts, ip)).ok) return forbidden();
  }
  const pass = await makePass(req.headers.get('user-agent')||'');
  return new Response('{"ok":true}', { status:200, headers:{ 'content-type':'application/json', 'cache-control':'no-store', 'set-cookie':passCookie(pass) } });
}
