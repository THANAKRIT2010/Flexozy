import { NextResponse } from 'next/server';
import { listVaults } from '@/lib/db';
import { getUser } from '@/lib/session';
import { origin } from '@/lib/vault';
import { createVault, publicRow } from '@/lib/create';
export const dynamic='force-dynamic';
// สำหรับผู้ใช้ทั่วไป: โค้ดลิงก์สุ่มเท่านั้น (ไม่รับ slug)
export async function POST(req){
  const user = await getUser(); if(!user) return NextResponse.json({error:'not_authenticated'},{status:401});
  return createVault(req, user, { allowSlug:false });
}
export async function GET(){ // เฉพาะลิงก์ของตัวเอง
  const user = await getUser(); if(!user) return NextResponse.json({error:'not_authenticated'},{status:401});
  const o = await origin();
  return NextResponse.json((await listVaults()).filter(v=>v.owner_id===user.id).sort((a,b)=>b.created_at-a.created_at).map(v=>publicRow(v,o)));
}
