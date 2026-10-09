import { getVault, saveVault, claimNonce } from '@/lib/db';
import { denied, readToken, xorB64, needsKey } from '@/lib/vault';
import { readKeyToken, keyStillValid } from '@/lib/keys';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
const NF = () => new Response('!404', T(404)); // ขึ้นต้นด้วย "!" = ข้อความผิดพลาด (ไม่ใช่ base64)
// ขั้นที่ 2: ต้องมี token (ลิงก์ปกติ: จาก /raw/CODE | ลิงก์ที่ต้องใช้ key: จาก /auth ผูก key+HWID) — หมดอายุ 60 วิ ใช้ได้ครั้งเดียว
export async function GET(req, { params }){
  const d = denied(req); if(d) return d;
  const { code } = await params, t = new URL(req.url).searchParams.get('t');
  const kt = String(t||'').split('.').length === 4 ? readKeyToken('v:'+code, t) : null;
  const nonce = kt ? kt.nonce : readToken(code, t); if(!nonce) return NF();
  const v = await getVault(code); if(!v) return NF();
  if(needsKey(v) && !kt) return NF(); // token แบบไม่มี key ใช้กับลิงก์ที่ต้องใช้ key ไม่ได้
  if(!await claimNonce(nonce)) return NF();
  if(kt && !await keyStillValid(kt.kid, 'v:'+code)) return NF();
  v.views = (v.views||0)+1; await saveVault(v);
  return new Response(xorB64(v.script, nonce), T(200));
}
