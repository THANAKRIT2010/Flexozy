import { protectLoaderRequest } from '@/lib/loaderProtection';
import { denied } from '@/lib/vault';
import { buildStub } from '@/lib/stubSource';
export const dynamic = 'force-dynamic';
// https://api.flexozy.xyz/loader — ตัวสั้น (executor เท่านั้น เบราว์เซอร์/บอทได้ 403 เหมือน /raw)
export async function GET(req){
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  return new Response(await buildStub(), { status:200, headers:{
    'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex' } });
}
