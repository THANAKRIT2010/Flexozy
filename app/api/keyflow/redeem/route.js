import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { redeem, status } from '@/lib/earn';
export const dynamic = 'force-dynamic';
// POST {key} — แลกคีย์ที่ซื้อมา/มีอยู่แล้วเข้ากับบัญชีนี้
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ err:'login' }, { status:401 });
  const b = await req.json().catch(() => ({}));
  const r = await redeem(u.id, b?.key);
  const s = await status(u.id);
  return NextResponse.json({ ...r, ...s }, { status:r.err ? 400 : 200 });
}
