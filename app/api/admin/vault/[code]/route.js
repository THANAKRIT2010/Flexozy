import { NextResponse } from 'next/server';
import { getVault, saveVault, deleteVault } from '@/lib/db';
export const dynamic='force-dynamic';
import { getUser } from '@/lib/session';
export async function DELETE(_, { params }){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params; if(!await getVault(code)) return NextResponse.json({error:'not_found'},{status:404});
  await deleteVault(code); return new Response(null,{status:204});
}
// PATCH { needs_key: boolean } — เปิด/ปิดการบังคับใช้ key ของลิงก์นี้
export async function PATCH(req, { params }){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params, v = await getVault(code); if(!v) return NextResponse.json({error:'not_found'},{status:404});
  const b = await req.json().catch(()=>({})); v.needs_key = !!b.needs_key; await saveVault(v);
  return NextResponse.json({ ok:true, needs_key:v.needs_key });
}
