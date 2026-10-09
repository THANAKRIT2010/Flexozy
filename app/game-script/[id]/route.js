import { denied } from '@/lib/vault';
import { claimNonce } from '@/lib/db';
import { readKeyToken, keyStillValid } from '@/lib/keys';
import { xorB64 } from '@/lib/vault';
import { scriptUrlById } from '@/lib/games';
export const dynamic = 'force-dynamic';
const H = { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex' };
const NF = () => new Response('!404', { status:404, headers:H });
// GET /game-script/ID?t=TOKEN — เซิร์ฟเวอร์ดึงสคริปต์เกมจาก GitHub เอง (URL ไม่เคยถึง client) แล้วส่งแบบ XOR+base64
export async function GET(req, { params }){
  const d = denied(req); if(d) return d;
  const { id } = await params;
  if(!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) return NF();
  const kt = readKeyToken('hub:'+id, new URL(req.url).searchParams.get('t')); if(!kt) return NF();
  const url = scriptUrlById(id); if(!url) return NF();
  if(!await claimNonce(kt.nonce)) return NF();
  if(!await keyStillValid(kt.kid, 'hub:'+id)) return NF();
  try{
    const r = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(8000) }); if(!r.ok) return NF();
    const text = await r.text(); if(text.length > 3e6) return NF();
    return new Response(xorB64(text, kt.nonce), { status:200, headers:H });
  }catch{ return NF() }
}
