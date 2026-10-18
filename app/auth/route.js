import { denied, clientIp, EXEC_HEADERS } from '@/lib/vault';
import { forbidden } from '@/lib/bots';
import { authorize, autoKeyOn, autoKeyFor, hwidOk } from '@/lib/keys';
import { hit, logSec } from '@/lib/db';
import { checkChallenge, proofRequired } from '@/lib/proof';
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
  // v11: ต้องแนบ challenge (sc) + คำตอบ (pf) ที่ได้จากการ "รัน Lua จริง" — บอทที่ยิง POST /auth ตรง ๆ (แม้หน้าตาเหมือน Roblox) จะไม่มี
  // ใช้ได้ทั้งการขอ token ด้วย key และการขอออก key อัตโนมัติ (AUTO_KEY) ซึ่งเดิมเป็นช่องที่บอทเอา HWID สุ่มมาขอ key ฟรีได้
  if(proofRequired()){
    const c = checkChallenge(b.sc, b.pf, clientIp(req) || '');
    if(!c.ok){ await logSec('auth_no_proof', ip, 'challenge ' + c.reason); return J({ error:'bad_challenge' }, 403); }
    if(await hit('scuse:' + c.nonce, 21600) > 40) return J({ error:'rate_limited' }, 429); // challenge เดียวใช้ได้จำกัดครั้ง (เปิด hub ค้างไว้ได้ แต่เอาไปปั๊มไม่ได้)
    if(!String(b.key || '') && await hit('scauto:' + c.nonce, 21600) > 2) return J({ error:'rate_limited' }, 429);
  }
  let key = String(b.key||''), issued = '';
  if(!key){ // ไม่มีคีย์ = ขอให้ระบบออกให้ตาม HWID
    if(!autoKeyOn()) return J({ error:'key_required' }, 403);
    if(!hwidOk(b.hwid)) return J({ error:'bad_hwid' }, 403);
    if(await hit('autokey:'+ip, 3600) > 30) return J({ error:'rate_limited' }, 429);
    const a = await autoKeyFor(b.hwid); if(a.err) return J({ error:a.err }, 403);
    key = issued = a.key;
  }
  const r = await authorize(key, b.hwid, String(b.scope||''), ip, { uid:b.uid, un:b.un, dn:b.dn, hws:b.hws });
  if(r.err){
    // ผิดซ้ำเกิน 8 ครั้งใน 10 นาทีต่อ IP → ล็อกชั่วคราว (กันเดา key)
    if(await hit('authbad:'+ip, 600) > 8) return J({ error:'rate_limited' }, 429);
    return J({ error:r.err }, 403);
  }
  return J({ token:r.token, runs:r.runs, ...(issued ? { key:issued } : {}) }, 200);
});
