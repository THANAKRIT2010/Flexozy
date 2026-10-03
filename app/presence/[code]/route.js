import { getVault } from '@/lib/db';
import { updatePlayer } from '@/lib/presence';
export const dynamic = 'force-dynamic';
export async function POST(req, { params }){
  const { code } = await params;
  if(!await getVault(code)) return new Response('not_found', { status:404 });
  const body = await req.json().catch(() => null);
  if(!body || typeof body.name !== 'string' || !/^[\w ]{1,32}$/.test(body.name) || !/^\d{1,20}$/.test(String(body.userId || '')))
    return new Response('invalid', { status:400 });
  await updatePlayer(code, body);
  return new Response(null, { status:204, headers:{ 'Cache-Control':'no-store' } });
}
