import { protectLoaderRequest } from '@/lib/loaderProtection';
import { denied, EXEC_HEADERS } from '@/lib/vault';
import { buildLoader } from '@/lib/loaderSource';
import { readBootToken } from '@/lib/bootToken';
import { claimNonce } from '@/lib/db';
import { forbidden } from '@/lib/bots';
import { isApiHost } from '@/lib/net';
import { safe, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
// ปิดสนิท: โดเมนเว็บ (flexozy.xyz/bootstrap-source) → 404 เสมอ | โดเมน API ต้องมี token จาก /loader (ใช้ครั้งเดียว) — เรียกตรง ๆ ไม่ได้ซอส
export const GET = safe(async (req) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  const nonce = readBootToken(new URL(req.url).searchParams.get('t')); if(!nonce) return forbidden();
  if(!await claimNonce('bs:' + nonce, 150)) return forbidden();
  return new Response(await buildLoader(), { status:200, headers:EXEC_HEADERS });
});
