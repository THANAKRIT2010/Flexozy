import { NextResponse } from 'next/server';
// API hostname serves only raw reads and player heartbeats.
export function middleware(req){
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST||'api.flexozy.xyz').toLowerCase();
  if(!api || host !== api) return NextResponse.next();
  const path = req.nextUrl.pathname, txt = (b,s)=>new NextResponse(b,{status:s,headers:{'content-type':'text/plain'}});
  if(path==='/') return txt('Flexozy Vault API',200);
  if(req.method==='POST' && /^\/presence\/[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
  if(req.method!=='GET') return txt('not_found',404);
  if(/^\/raw\/[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
  return txt('not_found',404);
}
export const config = { matcher:'/((?!_next/).*)' };
