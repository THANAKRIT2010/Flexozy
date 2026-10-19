import { getVault, incrViews, claimNonce, logSec } from '@/lib/db';
import { denied, readToken, stageProofOk, xorB64, needsKey, EXEC_HEADERS } from '@/lib/vault';
import { readKeyToken, keyStillValid } from '@/lib/keys';
import { protectLoaderRequest, noteRawRedeemed } from '@/lib/loaderProtection';
import { clientIp } from '@/lib/net';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
const NF = () => new Response('!404', { status:404, headers:EXEC_HEADERS }); // ขึ้นต้นด้วย "!" = ข้อความผิดพลาด (ไม่ใช่ base64)
// ขั้นที่ 2: ต้องมี token (ลิงก์ปกติ: จาก /raw/CODE | ลิงก์ที่ต้องใช้ key: จาก /auth ผูก key+HWID) — หมดอายุ 60 วิ ใช้ได้ครั้งเดียว
// v11: ลิงก์ปกติ → token ต้องมาจาก IP เดียวกับที่ขอ /raw + ต้องแนบ p (ผลของโปรแกรม Lua ที่สุ่มใหม่ทุกครั้ง) ; ลิงก์ key → proof ถูกบังคับที่ /auth แล้ว
export const GET = safe(async (req, { params }) => {
  const d = denied(req); if(d) return d;
  const limited = await protectLoaderRequest(req, '/stage'); if(limited) return limited;
  const { code } = await params, sp = new URL(req.url).searchParams, t = sp.get('t'), ip = clientIp(req) || '';
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return NF();
  const isKey = String(t||'').split('.').length === 4, kt = isKey ? readKeyToken('v:'+code, t) : null;
  const nonce = kt ? kt.nonce : readToken(code, t, ip);
  if(!nonce){ if(!isKey) await logSec('token_ip_mismatch', ip, `stage/${code}: token ไม่ถูกต้อง/หมดอายุ/มาจาก IP อื่น`); return NF(); }
  if(!kt && !stageProofOk(nonce, sp.get('p'))){ await logSec('stage_no_proof', ip, `stage/${code}: ไม่มีผลพิสูจน์การรัน Lua`); return NF(); }
  const v = await getVault(code); if(!v) return NF();
  if(needsKey(v) && !kt) return NF(); // token แบบไม่มี key ใช้กับลิงก์ที่ต้องใช้ key ไม่ได้
  if(kt && !await keyStillValid(kt.kid, 'v:'+code)) return NF();
  if(!await claimNonce(nonce)){ if(!kt) await logSec('token_replay', ip, `stage/${code}: ใช้ token ซ้ำ`); return NF(); }
  if(!kt) await noteRawRedeemed(req);
  await incrViews(code);
  return new Response(xorB64(v.script, nonce), { status:200, headers:EXEC_HEADERS });
});
