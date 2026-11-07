import { protectLoaderRequest, noteLoaderRedeemed } from '@/lib/loaderProtection';
import { denied, EXEC_HEADERS } from '@/lib/vault';
import { buildLoader } from '@/lib/loaderSource';
import { readBootToken } from '@/lib/bootToken';
import { claimNonce } from '@/lib/db';
import { forbidden } from '@/lib/bots';
import { uaBind, strike } from '@/lib/guard';
import { clientIp, isApiHost } from '@/lib/net';
import { safe, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
// ปิดสนิท: โดเมนเว็บ (flexozy.xyz/bootstrap-source) → 404 เสมอ | โดเมน API ต้องมี token จาก /loader (ใช้ครั้งเดียว + ต้องมาจาก IP เดียวกับที่ขอ) — เรียกตรง ๆ ไม่ได้ซอส
export const GET = safe(async (req) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  const ip = clientIp(req) || '';
  const r = readBootToken(new URL(req.url).searchParams.get('t'), ip, uaBind(req));
  if(!r.nonce){ if(r.reason === 'ip') await strike(req, 'token_ip_mismatch', 'token ถูกนำไปใช้จาก IP/UA อื่น'); return forbidden(); }
  if(!await claimNonce('bs:' + r.nonce, 150)){ await strike(req, 'token_replay', 'ใช้ token ซ้ำ'); return forbidden(); }
  await noteLoaderRedeemed(req);
  return new Response(await buildLoader(ip), { status:200, headers:EXEC_HEADERS });
});
