import { getVault, saveVault } from '@/lib/db';
import { checkPw } from '@/lib/vault';
const T = { headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'} };
export async function GET(req, { params }){
  const { code } = await params, v = await getVault(code);
  if(!v) return new Response('-- [Flexozy] not found', { status:404, ...T });
  const roblox = (req.headers.get('user-agent')||'').toLowerCase().includes('roblox');
  if(v.hash && !roblox && !checkPw(v, new URL(req.url).searchParams.get('password')))
    return new Response('-- [Flexozy] password required: add ?password=...', { status:401, ...T });
  v.views=(v.views||0)+1; await saveVault(v);
  return new Response(v.script, T);
}
