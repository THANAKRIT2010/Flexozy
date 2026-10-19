import { NextResponse } from 'next/server';
import { getVault, saveVault, deleteVault } from '@/lib/db';
export const dynamic='force-dynamic';
import { getUser } from '@/lib/session';
import { updateVault } from '@/lib/create';
export async function DELETE(_, { params }){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params; if(!await getVault(code)) return NextResponse.json({error:'not_found'},{status:404});
  await deleteVault(code); return new Response(null,{status:204});
}
// PATCH { needs_key?, title?, script?, password? } — เปิด/ปิด key, แก้โค้ด, เปลี่ยน/ลบรหัสผ่านของลิงก์
export async function PATCH(req, { params }){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params, v = await getVault(code); if(!v) return NextResponse.json({error:'not_found'},{status:404});
  return updateVault(req, v, u); // v11: แก้ได้ทั้ง needs_key / โค้ด / ชื่อ / รหัสผ่าน
}
