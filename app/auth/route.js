import { denied, clientIp } from '@/lib/vault';
import { forbidden } from '@/lib/bots';
import { authorize } from '@/lib/keys';
import { hit } from '@/lib/db';
export const dynamic = 'force-dynamic';
const J = (o, s) => new Response(JSON.stringify(o), { status:s, headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
// POST /auth {key, hwid, scope} → { token } (executor เท่านั้น)
export async function POST(req){
  const d = denied(req); if(d) return d;
  const ip = clientIp(req) || 'unknown';
  if(await hit('auth:'+ip, 60) > 30) return J({ error:'rate_limited' }, 429);
  const raw = await req.text().catch(()=>''); if(raw.length > 1024) return forbidden();
  let b; try{ b = JSON.parse(raw) }catch{ return forbidden() }
  const r = await authorize(String(b?.key||''), b?.hwid, String(b?.scope||''), ip);
  if(r.err){
    // ผิดซ้ำเกิน 8 ครั้งใน 10 นาทีต่อ IP → ล็อกชั่วคราว (กันเดา key)
    if(await hit('authbad:'+ip, 600) > 8) return J({ error:'rate_limited' }, 429);
    return J({ error:r.err }, 403);
  }
  return J({ token:r.token }, 200);
}
