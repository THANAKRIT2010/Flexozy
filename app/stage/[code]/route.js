import { getVault, saveVault, claimNonce } from '@/lib/db';
import { denied, readToken, xorB64 } from '@/lib/vault';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
const NF = () => new Response('-- [Flexozy] 404', T(404));
// ขั้นที่ 2: ต้องมี token จาก /raw/CODE (เซ็นแล้ว หมดอายุ 60 วิ ใช้ได้ครั้งเดียว) ถึงจะได้สคริปต์ (เข้ารหัสด้วย nonce ของ token)
export async function GET(req, { params }){
  const d = denied(req); if(d) return d;
  const { code } = await params;
  const nonce = readToken(code, new URL(req.url).searchParams.get('t')); if(!nonce) return NF();
  const v = await getVault(code); if(!v) return NF();
  if(!await claimNonce(nonce)) return NF();
  v.views = (v.views||0)+1; await saveVault(v);
  return new Response(xorB64(v.script, nonce), T(200));
}
