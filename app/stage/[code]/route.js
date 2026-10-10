import { getVault, incrViews, claimNonce } from '@/lib/db';
import { denied, readToken, xorB64, needsKey, EXEC_HEADERS } from '@/lib/vault';
import { readKeyToken, keyStillValid } from '@/lib/keys';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
const NF = () => new Response('!404', { status:404, headers:EXEC_HEADERS }); // ขึ้นต้นด้วย "!" = ข้อความผิดพลาด (ไม่ใช่ base64)
// ขั้นที่ 2: ต้องมี token (ลิงก์ปกติ: จาก /raw/CODE | ลิงก์ที่ต้องใช้ key: จาก /auth ผูก key+HWID) — หมดอายุ 60 วิ ใช้ได้ครั้งเดียว
export const GET = safe(async (req, { params }) => {
  const d = denied(req); if(d) return d;
  const { code } = await params, t = new URL(req.url).searchParams.get('t');
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return NF();
  const kt = String(t||'').split('.').length === 4 ? readKeyToken('v:'+code, t) : null;
  const nonce = kt ? kt.nonce : readToken(code, t); if(!nonce) return NF();
  const v = await getVault(code); if(!v) return NF();
  if(needsKey(v) && !kt) return NF(); // token แบบไม่มี key ใช้กับลิงก์ที่ต้องใช้ key ไม่ได้
  if(kt && !await keyStillValid(kt.kid, 'v:'+code)) return NF();
  if(!await claimNonce(nonce)) return NF();
  await incrViews(code);
  return new Response(xorB64(v.script, nonce), { status:200, headers:EXEC_HEADERS });
});
