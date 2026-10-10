import { protectLoaderRequest } from '@/lib/loaderProtection';
import { denied, xorB64, EXEC_HEADERS } from '@/lib/vault';
import { claimNonce } from '@/lib/db';
import { readKeyToken, keyStillValid } from '@/lib/keys';
import { scriptUrlById } from '@/lib/games';
import { fetchScript } from '@/lib/safeFetch';
import { isApiHost } from '@/lib/net';
import { safe, notFound } from '@/lib/http';
export const dynamic = 'force-dynamic';
const NF = () => new Response('!404', { status:404, headers:EXEC_HEADERS });
// GET /game-script/ID?t=TOKEN — เซิร์ฟเวอร์ดึงสคริปต์เกมเอง (URL ไม่เคยถึง client) แล้วส่งแบบ XOR+base64
export const GET = safe(async (req, { params }) => {
  if(!isApiHost(req)) return notFound();
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req); if(limited) return limited;
  const { id } = await params;
  if(!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) return NF();
  const kt = readKeyToken('hub:'+id, new URL(req.url).searchParams.get('t')); if(!kt) return NF();
  const url = await scriptUrlById(id); if(!url) return NF();
  if(!await keyStillValid(kt.kid, 'hub:'+id)) return NF();
  if(!await claimNonce(kt.nonce)) return NF(); // ตรวจ key ก่อนค่อยใช้ token — token ที่ key ถูกเพิกถอนแล้วไม่ต้องกินโควตา
  try{ return new Response(xorB64(await fetchScript(url), kt.nonce), { status:200, headers:EXEC_HEADERS }); }
  catch{ return NF(); }
});
