import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { status, start, claim } from '@/lib/earn';
export const dynamic = 'force-dynamic';
// สถานะการรับคีย์ของบัญชีที่ล็อกอิน · POST {action:'start'|'claim', task:'yt'|'dc'}
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ authenticated:false });
  return NextResponse.json({ authenticated:true, user:u, ...(await status(u.id)) });
}
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ err:'login' }, { status:401 });
  let b; try{ b = await req.json(); }catch{ return NextResponse.json({ err:'bad_action' }, { status:400 }); }
  const task = String(b?.task || '');
  const r = b?.action === 'start' ? await start(u.id, task) : b?.action === 'claim' ? await claim(u.id, task) : { err:'bad_action' };
  const s = await status(u.id);
  return NextResponse.json({ ...r, ...s }, { status: r.err ? 400 : 200 });
}
