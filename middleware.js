import { NextResponse } from 'next/server';
import { BOT_RE } from './lib/bots';
const deny = (s) => new NextResponse(String(s), { status:s, headers:{'content-type':'text/plain','cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'} });
// 1) ทุกโดเมน ทุกหน้า: AI / crawler / เครื่องมือยิง HTTP (ดู lib/bots.js) → 404 (ยกเว้น Discordbot ดูตัวอย่างลิงก์ของ "หน้าเว็บ" ไม่รวม /raw /stage /ping /api)
//    ไม่มี User-Agent เลยเข้าเว็บหลักไม่ได้ → 403
// 2) โดเมน API_HOST (api.flexozy.xyz): รับ GET /raw/CODE, /stage/CODE และ /ping/CODE (และ /CODE แบบเก่า) — ส่วนอื่น 404
export function middleware(req){
  const ua = req.headers.get('user-agent')||'', path = req.nextUrl.pathname;
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST || (process.env.NODE_ENV==='production' ? 'api.flexozy.xyz' : '')).toLowerCase();
  const isApi = !!api && host === api, machine = /^\/(raw|stage|ping|api)\//.test(path);
  if(BOT_RE.test(ua) && !(!isApi && !machine && /discordbot/i.test(ua))) return deny(404);
  if(!ua && !isApi) return deny(403);
  if(!isApi) return NextResponse.next();
  const txt = (b,s)=>new NextResponse(b,{status:s,headers:{'content-type':'text/plain'}});
  if(path==='/') return txt('Flexozy Vault API',200);
  if(req.method!=='GET') return txt('not_found',404);
  if(/^\/(raw\/(vault\/)?|ping\/|stage\/)[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
  const m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
  if(!m) return txt('not_found',404);
  const u = req.nextUrl.clone(); u.pathname = `/raw/${m[1]}`; return NextResponse.rewrite(u);
}
export const config = { matcher:'/((?!_next/).*)' };
