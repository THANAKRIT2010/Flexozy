import { NextResponse } from 'next/server';
import { getVault, incrViews, hit } from '@/lib/db';
import { checkPw, isBot, needsKey, clientIp } from '@/lib/vault';
import { getUser } from '@/lib/session';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
export const POST = safe(async (req, { params }) => {
  if(isBot(req)) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params; if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return NextResponse.json({error:'not_found'},{status:404});
  // กันเดารหัสผ่าน: 10 ครั้ง/นาที และ 40 ครั้ง/ชม. ต่อ IP+ลิงก์
  const k = `${clientIp(req)||'x'}:${code}`;
  if(await hit('pw1:'+k, 60) > 10 || await hit('pw2:'+k, 3600) > 40) return NextResponse.json({error:'rate_limited'},{status:429});
  const v = await getVault(code); if(!v) return NextResponse.json({error:'not_found'},{status:404});
  // ลิงก์ที่บังคับ key: เดิมหน้านี้ยังคืนซอสให้ใครก็ได้ (ข้าม key ได้) — ตอนนี้เฉพาะเจ้าของ/แอดมิน
  if(needsKey(v)){ const u = await getUser(); if(!u || !(u.is_admin || u.id === v.owner_id)) return NextResponse.json({error:'key_required'},{status:403}); }
  const { password } = await req.json().catch(()=>({}));
  if(!checkPw(v, password)) return NextResponse.json({error:'wrong_password'},{status:401});
  await incrViews(code);
  return NextResponse.json({ title:v.title, script:v.script });
});
