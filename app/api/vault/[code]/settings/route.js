import { NextResponse } from 'next/server';
import { getVault, saveVault } from '@/lib/db';
import { getUser } from '@/lib/session';
// สวิตช์ความปลอดภัยของลิงก์ (เจ้าของ/แอดมิน): lic = ต้องมีคีย์ผูกเครื่องถึงจะได้สคริปต์ | hide = ซ่อนซอสบนหน้าเว็บ
export async function PATCH(req, { params }){
  const { code } = await params, u = await getUser(), v = await getVault(code);
  if(!u) return NextResponse.json({error:'not_authenticated'},{status:401});
  if(!v || (!u.is_admin && v.owner_id !== u.id)) return NextResponse.json({error:'not_found'},{status:404});
  const b = await req.json().catch(()=>({}));
  if(typeof b.lic==='boolean') v.lic = b.lic;
  if(typeof b.hide==='boolean') v.hide = b.hide;
  await saveVault(v); return NextResponse.json({ lic:!!v.lic, hide:!!v.hide });
}
