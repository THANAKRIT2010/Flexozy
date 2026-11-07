import { NextResponse } from 'next/server';
import { getVault, deleteVault } from '@/lib/db';
import { getUser } from '@/lib/session';
import { updateVault } from '@/lib/create';
export const dynamic = 'force-dynamic';
const NS = { 'cache-control':'no-store, private' };
// เจ้าของลิงก์หรือแอดมินเท่านั้น (ไม่ใช่เจ้าของ = 404 เหมือนไม่มีลิงก์)
async function owned(params){
  const { code } = await params, user = await getUser();
  if(!user) return { res:NextResponse.json({error:'not_authenticated'},{status:401}) };
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return { res:NextResponse.json({error:'not_found'},{status:404}) };
  const v = await getVault(code);
  if(!v || (v.owner_id !== user.id && !user.is_admin)) return { res:NextResponse.json({error:'not_found'},{status:404}) };
  return { v, user, code };
}
// ดึงข้อมูลไปหน้าแก้ไข (โค้ด + ชื่อ + สถานะรหัสผ่านเท่านั้น — ไม่ส่ง hash/salt)
export async function GET(_, { params }){
  const o = await owned(params); if(o.res) return o.res;
  return NextResponse.json({ code:o.v.code, title:o.v.title, script:o.v.script, has_password:!!o.v.hash, needs_key:!!o.v.needs_key }, { headers:NS });
}
// PATCH { title?, script?, password? ('' = ลบ) , needs_key? (แอดมินเท่านั้น) }
export async function PATCH(req, { params }){
  const o = await owned(params); if(o.res) return o.res;
  return updateVault(req, o.v, o.user);
}
export async function DELETE(_, { params }){
  const o = await owned(params); if(o.res) return o.res;
  await deleteVault(o.code); return new Response(null,{status:204});
}
