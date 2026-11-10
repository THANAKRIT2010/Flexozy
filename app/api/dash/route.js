import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listUserVaults, getTokens, getDaily, lockCost } from '@/lib/db';
import { origin } from '@/lib/vault';
import { publicRow } from '@/lib/create';
export const dynamic = 'force-dynamic';
// ข้อมูลทั้งแดชบอร์ดในคำขอเดียว (me + TOKEN + ลิงก์ + สถิติรายวัน) แคชในหน่วยความจำ 15 วินาทีต่อผู้ใช้ — กดสลับ 7/14/30 วัน ไม่ยิง KV ซ้ำ
const C = globalThis.__fxDash ||= new Map();
export async function GET(req){
  const user = await getUser(); if(!user) return NextResponse.json({ authenticated:false });
  const raw = Number(new URL(req.url).searchParams.get('days')); const days = [7, 14, 30].includes(raw) ? raw : 30;
  const sp = new URL(req.url).searchParams, key = user.id + ':' + days, now = Date.now(), hit = C.get(key);
  let body = hit && hit.t > now && sp.get('fresh') !== '1' ? hit.b : null; // ?fresh=1 หลังสร้าง/ลบ/แก้ลิงก์ ข้ามแคช
  if(!body){
    const [links, tokens, series] = await Promise.all([listUserVaults(user.id), getTokens(user.id).catch(() => null), getDaily(user.id, days)]);
    const o = await origin();
    body = { authenticated:true, user, tokens, lock_cost:lockCost(), days, series,
      links:links.sort((a, b) => b.created_at - a.created_at).map(v => publicRow(v, o)) };
    if(C.size > 300) C.clear(); C.set(key, { t:now + 15000, b:body });
  }
  return NextResponse.json(body, { headers:{ 'Cache-Control':'private, no-store' } });
}
