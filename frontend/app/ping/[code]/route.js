import { vaultExists, pingPlayer, hit } from '@/lib/db';
import { isBot, isBrowser, clientIp } from '@/lib/vault';
import { forbidden } from '@/lib/bots';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
const T = (b,s) => new Response(b,{ status:s, headers:{'Content-Type':'text/plain','Cache-Control':'no-store','CDN-Cache-Control':'no-store'} });
const clean = (s,n) => String(s||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,n);
// ถูกเรียกจากโค้ดที่แปะไว้หน้าสคริปต์ (ทุก 10 นาที) — ใช้บอกว่าใครกำลังรันอยู่
export const GET = safe(async (req, { params }) => {
  if(isBot(req) || isBrowser(req)) return forbidden();
  const { code } = await params, sp = new URL(req.url).searchParams, id = String(sp.get('u')||'');
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code) || !/^\d{1,16}$/.test(id)) return T('bad',400);
  // กันยิงปลอมให้ KV บวม: ต่อ IP และต่อโค้ดลิงก์
  const ip = clientIp(req) || 'unknown';
  if(await hit('ping:'+ip, 60) > 30 || await hit('pingc:'+code, 60) > 600) return T('slow',429);
  if(!await vaultExists(code)) return T('not_found',404);
  await pingPlayer(code, { id, name:clean(sp.get('n'),40), display:clean(sp.get('d'),50), place:clean(sp.get('p'),20), game:clean(sp.get('g'),80), ts:Date.now() });
  return T('ok',200);
});
