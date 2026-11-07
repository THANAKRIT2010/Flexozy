import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUser } from '@/lib/session';
import { allGames } from '@/lib/games';
import { fetchScript } from '@/lib/safeFetch';
import { getGameCode, saveGameCode, deleteGameCode, hit } from '@/lib/db';
export const dynamic = 'force-dynamic';
const J = (b, s = 200) => NextResponse.json(b, { status:s });
// รหัสผ่านเปิดตัวแก้โค้ดแมพ — ตรวจที่เซิร์ฟเวอร์เท่านั้น (ไม่ฝังในหน้าเว็บ) · เปลี่ยนได้ด้วย ENV MAP_CODE_PASSWORD
const PASS = () => process.env.MAP_CODE_PASSWORD || 'Thanakrit';
const same = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
const MAX = 2e6, ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
async function gate(req){
  const u = await getUser(); if(!u?.is_admin) return { res:J({ error:'not_found' }, 404) };
  const b = await req.json().catch(() => ({})) || {};
  if(await hit('mapcode:' + u.id, 600) > 12) return { res:J({ error:'ลองรหัสผ่านถี่เกินไป รอสักครู่' }, 429) }; // กันเดารหัส
  if(!same(b.password ?? '', PASS())) return { res:J({ error:'รหัสผ่านไม่ถูกต้อง' }, 401) };
  const id = String(b.id || ''); if(!ID.test(id)) return { res:J({ error:'รหัสแมพไม่ถูกต้อง' }, 400) };
  return { b, id };
}
// POST { id, password } → โหลดโค้ดปัจจุบัน (ถ้าเคยแก้ไว้ = โค้ดที่แก้ / ถ้ายัง = ดึงจากต้นฉบับ Script URL)
export async function POST(req){
  const g = await gate(req); if(g.res) return g.res;
  const ov = await getGameCode(g.id); if(ov?.code != null) return J({ code:ov.code, source:'edited', updated_at:ov.updated_at });
  const game = (await allGames()).find(x => x.id === g.id), url = game?.url || '';
  if(!url) return J({ code:'', source:'empty' });
  try{ return J({ code:await fetchScript(url, { max:3e6, timeout:10000 }), source:'url' }); }
  catch(e){ return J({ error:'ดึงโค้ดต้นฉบับไม่สำเร็จ: ' + String(e?.message || e).slice(0, 100) }, 502); }
}
// PUT { id, password, code } → บันทึกโค้ดที่แก้ (เซิร์ฟเวอร์จะส่งโค้ดนี้แทน Script URL)
export async function PUT(req){
  const g = await gate(req); if(g.res) return g.res;
  const code = typeof g.b.code === 'string' ? g.b.code : '';
  if(!code.trim()) return J({ error:'โค้ดว่างเปล่า' }, 400);
  if(code.length > MAX) return J({ error:'โค้ดยาวเกินไป' }, 413);
  await saveGameCode(g.id, code); return J({ ok:true, bytes:Buffer.byteLength(code) });
}
// DELETE { id, password } → ล้างโค้ดที่แก้ แล้วกลับไปใช้ต้นฉบับจาก Script URL
export async function DELETE(req){
  const g = await gate(req); if(g.res) return g.res;
  await deleteGameCode(g.id); return J({ ok:true });
}
