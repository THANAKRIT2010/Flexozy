import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getTokens, addTokens, logSec } from '@/lib/db';
export const dynamic='force-dynamic';
const guard = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({error:'not_found'},{status:404});
const ID = /^\d{5,25}$/;
// GET ?uid=DISCORD_ID → ยอดคงเหลือ · POST { uid, delta } → เพิ่ม/ลด TOKEN (delta ติดลบได้)
export async function GET(req){
  if(!await guard()) return deny();
  const uid = new URL(req.url).searchParams.get('uid') || '';
  if(!ID.test(uid)) return NextResponse.json({error:'bad_request'},{status:400});
  return NextResponse.json({ uid, tokens:await getTokens(uid) });
}
export async function POST(req){
  const adm = await guard(); if(!adm) return deny();
  const b = await req.json().catch(()=>null);
  const delta = Math.trunc(Number(b?.delta));
  if(!b || !ID.test(String(b.uid)) || !Number.isFinite(delta) || Math.abs(delta) > 1e9) return NextResponse.json({error:'bad_request'},{status:400});
  const tokens = await addTokens(String(b.uid), delta);
  await logSec('token_adjust', '', `${adm.username}: ${delta > 0 ? '+' : ''}${delta} → ${b.uid}`); // บันทึกใน log ความปลอดภัย (/admin/settings)
  return NextResponse.json({ uid:String(b.uid), tokens });
}
