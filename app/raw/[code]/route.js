import { getVault, saveVault } from '@/lib/db';
import { denied, tracker, origin, staged, stagedStub, needsKey, keyedStub } from '@/lib/vault';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
export async function GET(req, { params }){
  const d = denied(req); if(d) return d; // AI/บอท/เบราว์เซอร์ ถูกตัดก่อนแม้แต่เช็คว่ามีลิงก์จริงไหม
  const { code } = await params, v = await getVault(code);
  if(!v) return new Response('-- [Flexozy] not found', T(404));
  // ลิงก์ที่ต้องใช้ key: ส่งแค่ stub ที่ไม่มีความลับ (ไม่มี token) — ต้องมี key+HWID ผ่าน /auth ถึงจะได้ซอส
  if(needsKey(v)) return new Response(keyedStub(await origin(), code), T(200));
  // API สำหรับ executor เท่านั้น — เปิดจากเบราว์เซอร์จะไม่เห็นโค้ดจริง (ลิงก์ที่มีรหัสผ่านก็ทำงานบน executor ได้ทันที ไม่ต้องใส่รหัสใน URL)
  if(staged()) return new Response(stagedStub(await origin(), code), T(200)); // ขั้นที่ 1: ส่งแค่ stub (นับ views ที่ขั้นที่ 2)
  v.views = (v.views||0)+1; await saveVault(v);
  return new Response(tracker(await origin(), code) + v.script, T(200));
}
