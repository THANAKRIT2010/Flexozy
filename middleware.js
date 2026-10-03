import { NextResponse } from 'next/server';
// โดเมน API_HOST (เช่น api.flexozy.xyz) รับเฉพาะ GET /CODE แล้วส่งต่อไปที่ /raw/vault/CODE ภายใน
export function middleware(req){
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST||'').toLowerCase();
  if(!api || host !== api) return NextResponse.next();
  const path = req.nextUrl.pathname, m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
  if(req.method !== 'GET' || !m)
    return new NextResponse(path==='/'?'Flexozy Vault API':'not_found',{ status:path==='/'?200:404, headers:{'content-type':'text/plain'} });
  const u = req.nextUrl.clone(); u.pathname = `/raw/vault/${m[1]}`; return NextResponse.rewrite(u);
}
export const config = { matcher:'/((?!_next/).*)' };
