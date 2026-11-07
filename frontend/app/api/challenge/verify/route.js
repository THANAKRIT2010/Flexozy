import { forbidden } from '@/lib/bots';
import { checkChallenge, makePass, passCookie, POW_ZEROS, POW_ZEROS_HARD } from '@/lib/pass';
import { turnstileConfigured, siteverify } from '@/lib/turnstileCore';
import { SecretError } from '@/lib/secret';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
const ip = (req) => (req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for')||'').split(',').pop() || '').trim();
// รับคำตอบจากหน้าตรวจสอบความปลอดภัย → ออก cookie fx_pass (ผิดทุกกรณีตอบ 403 เหมือนกัน)
// ปกติ: PoW + Turnstile | Turnstile ใช้ไม่ได้ (Cloudflare บล็อก/ล่ม — client ส่ง nots:1) → PoW ระดับยาก (5 ศูนย์) แทน — ยกเว้นตั้ง TURNSTILE_STRICT=1
export async function POST(req){
  try{
    let b; try{ b = await req.json() }catch{ return forbidden() }
    if(!b || b.f) return forbidden();
    const strict = process.env.TURNSTILE_STRICT === '1';
    if(turnstileConfigured() && !b.nots){
      if(!await checkChallenge(b.c, b.n, POW_ZEROS)) return forbidden();
      const r = await siteverify(String(b.ts||''), ip(req));
      if(r === 'failed') return forbidden();
      if(r === 'unreachable' && !await checkChallenge(b.c, b.n, POW_ZEROS_HARD)) return forbidden(); // เซิร์ฟเวอร์เราเรียก Cloudflare ไม่ได้
    }else{
      if(turnstileConfigured() && strict) return forbidden();
      if(!await checkChallenge(b.c, b.n, turnstileConfigured() ? POW_ZEROS_HARD : POW_ZEROS)) return forbidden();
    }
    const pass = await makePass(req.headers.get('user-agent')||'');
    return new Response('{"ok":true}', { status:200, headers:{ 'content-type':'application/json', 'cache-control':'no-store', 'set-cookie':passCookie(pass) } });
  }catch(e){ return e instanceof SecretError ? new Response('Service unavailable',{status:503}) : forbidden(); }
}
