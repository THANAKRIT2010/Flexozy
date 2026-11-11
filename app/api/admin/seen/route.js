import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listSeen, listBans } from '@/lib/db';
export const dynamic = 'force-dynamic';
// GET → ผู้ที่ส่งคำขอ/รันสคริปต์ล่าสุด (IP · HWID · Roblox) + สถานะว่าถูกแบนอยู่ไหม (แอดมินเท่านั้น)
export async function GET(){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({ error:'not_found' }, { status:404 });
  const [seen, bans] = await Promise.all([listSeen(400), listBans()]), on = new Set(bans.map(b => b.ip));
  const rows = seen.map(r => ({ ...r, b_ip:on.has(r.ip), b_hw:!!r.hh && on.has('hw:' + r.hh), b_uid:!!r.uid && on.has('uid:' + r.uid) }));
  return NextResponse.json({ rows }, { headers:{ 'cache-control':'no-store' } });
}
