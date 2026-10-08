import { vaultExists, pingPlayer } from '@/lib/db';
import { isBot } from '@/lib/vault';
export const dynamic='force-dynamic';
const T = (b,s) => new Response(b,{ status:s, headers:{'Content-Type':'text/plain','Cache-Control':'no-store'} });
const clean = (s,n) => String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,n);
// ถูกเรียกจากโค้ดที่แปะไว้หน้าสคริปต์ (ทุก 10 นาที) — ใช้บอกว่าใครกำลังรันอยู่
export async function GET(req, { params }){
  if(isBot(req)) return T('404',404);
  const { code } = await params, sp = new URL(req.url).searchParams, id = String(sp.get('u')||'');
  if(!/^\d{1,16}$/.test(id)) return T('bad',400);
  if(!await vaultExists(code)) return T('not_found',404);
  await pingPlayer(code, { id, name:clean(sp.get('n'),40), display:clean(sp.get('d'),50), place:clean(sp.get('p'),20), game:clean(sp.get('g'),80), ts:Date.now() });
  return T('ok',200);
}
