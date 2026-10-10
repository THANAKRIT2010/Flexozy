import { denied, clientIp, EXEC_HEADERS } from '@/lib/vault';
import { forbidden } from '@/lib/bots';
import { authorize } from '@/lib/keys';
import { hit } from '@/lib/db';
import { isApiHost } from '@/lib/net';
import { safe, json, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
const J = (o, s) => json(o, s, { 'cdn-cache-control':'no-store', 'x-robots-tag':'noindex' });
// POST /auth {key, hwid, scope} → { token } (executor เท่านั้น / โดเมน API เท่านั้น)
export const POST = safe(async (req) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const ip = clientIp(req) || 'unknown';
  if(await hit('auth:'+ip, 60) > 30) return J({ error:'rate_limited' }, 429);
  const raw = await req.text().catch(()=>''); if(raw.length > 1024) return forbidden();
  let b; try{ b = JSON.parse(raw) }catch{ return forbidden() }
  if(!b || typeof b !== 'object') return forbidden();
  const r = await authorize(String(b.key||''), b.hwid, String(b.scope||''), ip, { uid:b.uid, un:b.un });
  if(r.err){
    // ผิดซ้ำเกิน 8 ครั้งใน 10 นาทีต่อ IP → ล็อกชั่วคราว (กันเดา key)
    if(await hit('authbad:'+ip, 600) > 8) return J({ error:'rate_limited' }, 429);
    return J({ error:r.err }, 403);
  }
  return J({ token:r.token, runs:r.runs }, 200);
});
