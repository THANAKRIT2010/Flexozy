import { NextResponse } from 'next/server';
import { getVault, getPlayers } from '@/lib/db';
import { getUser } from '@/lib/session';
export const dynamic='force-dynamic';
// เฉพาะเจ้าของลิงก์ / แอดมิน เท่านั้นที่ดูรายชื่อผู้เล่นได้
export async function GET(_, { params }){
  const { code } = await params, u = await getUser(), v = await getVault(code);
  if(!u) return NextResponse.json({error:'not_authenticated'},{status:401});
  if(!v || (!u.is_admin && v.owner_id!==u.id)) return NextResponse.json({error:'not_found'},{status:404});
  const now = Date.now(), list = (await getPlayers(code)).sort((a,b)=>b.ts-a.ts)
    .map(p=>({ id:p.id, name:p.name, display:p.display, game:p.game, place:p.place, last_seen:p.ts, online:now-p.ts<120000 }));
  return NextResponse.json({ online:list.filter(p=>p.online).length, total:list.length, players:list.slice(0,200) },{ headers:{'Cache-Control':'no-store'} });
}
