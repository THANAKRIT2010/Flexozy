import { NextResponse } from 'next/server';
import { getVault, saveVault } from '@/lib/db';
import { checkPw, isBot } from '@/lib/vault';
import { getUser } from '@/lib/session';
export async function POST(req, { params }){
  if(isBot(req)) return NextResponse.json({error:'not_found'},{status:404}); // AI/บอท → 404
  const { code } = await params, v = await getVault(code);
  if(!v) return NextResponse.json({error:'not_found'},{status:404});
  // ลิงก์ที่ "ซ่อนโค้ด": คนทั่วไปไม่เห็นซอสบนหน้าเว็บ (เห็นแค่ loadstring) — เฉพาะเจ้าของ/แอดมินที่ล็อกอินเท่านั้น
  const u = await getUser(), owner = !!u && (u.is_admin || u.id === v.owner_id);
  if(v.hide && !owner) return NextResponse.json({ title:v.title, hidden:true });
  const { password } = await req.json().catch(()=>({}));
  if(!owner && !checkPw(v, password)) return NextResponse.json({error:'wrong_password'},{status:401});
  if(!v.hide){ v.views = (v.views||0)+1; await saveVault(v); }
  return NextResponse.json({ title:v.title, script:v.script });
}
