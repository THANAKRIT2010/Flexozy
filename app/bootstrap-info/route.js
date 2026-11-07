import { protectLoaderRequest } from '@/lib/loaderProtection';
import { denied, EXEC_HEADERS } from '@/lib/vault';
import { resolveScriptId } from '@/lib/games';
import { isApiHost } from '@/lib/net';
import { safe, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
// GET /bootstrap-info?universeId=..&placeId=..&gameName=..  →  { "scriptId": "mm2" }   (ไม่รู้จักเกม = "default")
export const GET = safe(async (req) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  const sp = new URL(req.url).searchParams, num = (v) => /^\d{1,16}$/.test(String(v||'')) ? String(v) : '0';
  const name = String(sp.get('gameName') || '').slice(0, 120);
  return new Response(JSON.stringify({ scriptId: await resolveScriptId(num(sp.get('universeId')), num(sp.get('placeId')), name) }), {
    status:200, headers:{ ...EXEC_HEADERS, 'Content-Type':'application/json; charset=utf-8' } });
});
