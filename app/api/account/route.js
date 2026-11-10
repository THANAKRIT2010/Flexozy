import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { hit } from '@/lib/db';
import { accountInfo, resetHwid } from '@/lib/earn';
export const dynamic = 'force-dynamic';
// GET ข้อมูลบัญชี/เครื่องที่ผูก · POST {action:'reset_hwid'} (รีเซ็ตได้วันละ 1 ครั้ง)
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ authenticated:false });
  return NextResponse.json({ authenticated:true, user:u, ...(await accountInfo(u.id)) });
}
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ err:'login' }, { status:401 });
  const b = await req.json().catch(() => ({}));
  if(b?.action !== 'reset_hwid') return NextResponse.json({ err:'bad_action' }, { status:400 });
  if(await hit('hwreset:' + u.id, 86400) > 1) return NextResponse.json({ err:'daily_limit' }, { status:429 });
  const r = await resetHwid(u.id);
  return NextResponse.json(r, { status:r.err ? 400 : 200 });
}
