import { NextResponse } from 'next/server';
// โดเมน API_HOST: รับ GET /raw/CODE (และ /CODE แบบเก่า) — ส่วนอื่น 404
export function middleware(req){
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST||'').toLowerCase();
  if(!api || host !== api) return NextResponse.next();
  const path = req.nextUrl.pathname, txt = (b,s)=>new NextResponse(b,{status:s,headers:{'content-type':'text/plain'}});
  if(path==='/') return txt('Flexozy Vault API',200);
  if(req.method!=='GET') return txt('not_found',404);
  if(/^\/raw\/(vault\/)?[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
  const m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
  if(!m) return txt('not_found',404);
  const u = req.nextUrl.clone(); u.pathname = `/raw/${m[1]}`; return NextResponse.rewrite(u);
}
export const config = { matcher:'/((?!_next/).*)' };
