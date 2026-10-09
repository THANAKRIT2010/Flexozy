import { denied } from '@/lib/vault';
import { resolveScriptId } from '@/lib/games';
export const dynamic = 'force-dynamic';
// GET /bootstrap-info?universeId=..&placeId=..  →  { "scriptId": "mm2" }   (ไม่รู้จักเกม = "default")
export async function GET(req){
  const d = denied(req); if(d) return d;
  const sp = new URL(req.url).searchParams;
  const num = (v) => /^\d{1,20}$/.test(String(v||'')) ? String(v) : '0';
  return new Response(JSON.stringify({ scriptId: await resolveScriptId(num(sp.get('universeId')), num(sp.get('placeId')), sp.get('gameName') || '') }), {
    status:200, headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex' } });
}
