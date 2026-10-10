import { protectLoaderRequest, noteLoaderIssued } from '@/lib/loaderProtection';
import { denied, EXEC_HEADERS } from '@/lib/vault';
import { buildStub } from '@/lib/stubSource';
import { makeBootToken } from '@/lib/bootToken';
import { clientIp, isApiHost } from '@/lib/net';
import { forbidden } from '@/lib/bots';
import { safe, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
// https://api.flexozy.xyz/loader — ตัวสั้น (executor เท่านั้น) ออก token ให้ /bootstrap-source (ใช้ครั้งเดียว 2 นาที ผูก IP)
// ตัว stub ถูกซีล: HttpGet แล้ว print จะไม่เห็นโดเมน/token/ตารางเกม — และดึงซ้ำโดยไม่ใช้ token จะถูกแบนชั่วคราว
export const GET = safe(async (req) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  if(await noteLoaderIssued(req)) return forbidden();
  return new Response(await buildStub(makeBootToken(clientIp(req) || '')), { status:200, headers:EXEC_HEADERS });
});
