import { getVault, saveVault, claimNonce } from '@/lib/db';
import { denied, readToken, xorB64 } from '@/lib/vault';
import { checkKey, logDelivery, watermark } from '@/lib/license';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
const NF = () => new Response('!404', T(404));
// ขึ้นต้นด้วย "!" = ข้อความข้อผิดพลาด (ไม่ใช่ base64) stub จะแสดงเป็น warn
const MSG = (m) => new Response('!'+m, T(200));
// ขั้นที่ 2: ต้องมี token จาก /raw/CODE (เซ็นแล้ว หมดอายุ 60 วิ ใช้ได้ครั้งเดียว) ถึงจะได้สคริปต์ (เข้ารหัสด้วย nonce ของ token)
// ลิงก์ที่เปิด "ต้องมีคีย์" (v.lic): ต้องส่ง k (script_key) + h (HWID) ด้วย → ตรวจคีย์/จำนวนเครื่อง/วันหมดอายุ + ใส่ลายน้ำและบันทึกการส่ง
export async function GET(req, { params }){
  const d = denied(req); if(d) return d;
  const { code } = await params, sp = new URL(req.url).searchParams;
  const nonce = readToken(code, sp.get('t')); if(!nonce) return NF();
  const v = await getVault(code); if(!v) return NF();
  if(!await claimNonce(nonce)) return NF();
  let key = '', out = v.script;
  if(v.lic){
    const k = String(sp.get('k')||'').slice(0,64), h = String(sp.get('h')||'').slice(0,200), u = /^\d{1,12}$/.test(sp.get('u')||'') ? sp.get('u') : '';
    if(!k || !h) return MSG('key');
    const r = checkKey(v, k, h, u);
    if(!r.ok){ await saveVault(v); return MSG(r.reason==='device' ? 'device (เครื่องเกินจำนวนที่กำหนด ติดต่อเจ้าของเพื่อรีเซ็ต)' : 'key (คีย์ไม่ถูกต้อง/หมดอายุ/ถูกยกเลิก)'); }
    key = k; out = watermark(v.script, nonce);
    logDelivery(v, { n:nonce, k:r.entry.id, u, t:Date.now() });
  }
  v.views = (v.views||0)+1; await saveVault(v);
  return new Response(xorB64(out, nonce + key), T(200));
}
