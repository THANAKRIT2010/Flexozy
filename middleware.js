import { NextResponse } from 'next/server';
import { BOT_RE } from './lib/bots';
// โดเมน API_HOST (api.flexozy.xyz): รับ GET /raw/CODE, /stage/CODE และ /ping/CODE (และ /CODE แบบเก่า) — ส่วนอื่น 404
export function middleware(req){
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST || (process.env.NODE_ENV==='production' ? 'api.flexozy.xyz' : '')).toLowerCase();
  if(!api || host !== api) return NextResponse.next();
  const path = req.nextUrl.pathname, txt = (b,s)=>new NextResponse(b,{status:s,headers:{'content-type':'text/plain'}});
  if(BOT_RE.test(req.headers.get('user-agent')||'')) return txt('404',404); // AI/บอท/crawler ได้ 404 ทุกเส้นทาง
  if(path==='/') return txt('Flexozy Vault API',200);
  if(req.method!=='GET') return txt('not_found',404);
  if(/^\/(raw\/(vault\/)?|ping\/|stage\/)[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
  const m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
  if(!m) return txt('not_found',404);
  const u = req.nextUrl.clone(); u.pathname = `/raw/${m[1]}`; return NextResponse.rewrite(u);
}
export const config = { matcher:'/((?!_next/).*)' };
