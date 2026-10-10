import { getVault, saveVault, incrViews } from '@/lib/db';
import { denied, tracker, origin, staged, stagedStub, needsKey, keyedStub, EXEC_HEADERS } from '@/lib/vault';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:EXEC_HEADERS });
export const GET = safe(async (req, { params }) => {
  const d = denied(req); if(d) return d; // AI/บอท/เบราว์เซอร์ ถูกตัดก่อนแม้แต่เช็คว่ามีลิงก์จริงไหม
  const { code } = await params;
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return new Response('-- [Flexozy] not found', T(404));
  const v = await getVault(code);
  if(!v) return new Response('-- [Flexozy] not found', T(404));
  // ลิงก์ที่ต้องใช้ key: ส่งแค่ stub ที่ไม่มีความลับ — ต้องมี key+HWID ผ่าน /auth ถึงจะได้ซอส
  if(needsKey(v)) return new Response(keyedStub(await origin(), code), T(200));
  if(staged()) return new Response(stagedStub(await origin(), code), T(200)); // ขั้นที่ 1: ส่งแค่ stub (นับ views ที่ขั้นที่ 2)
  await incrViews(code);
  return new Response(tracker(await origin(), code) + v.script, T(200));
});
