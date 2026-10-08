import { NextResponse } from 'next/server';
import { getVault, getPlayers } from '@/lib/db';
import { getUser } from '@/lib/session';
export const dynamic='force-dynamic';
const ONLINE_MS = 12*60*1000; // ping ทุก 10 นาที → ถือว่าออนไลน์ถ้ามีสัญญาณภายใน 12 นาที
// รูปโปรไฟล์ Roblox (headshot) — ดึงทีละ 100 ไอดี แคชในหน่วยความจำ 1 ชม.
const AV = globalThis.__fxAv ||= new Map();
async function avatars(ids){
  const now = Date.now(), need = ids.filter(i=>!(AV.get(i)?.t > now-3600e3));
  for(let i=0;i<need.length;i+=100){
    try{
      const r = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${need.slice(i,i+100).join(',')}&size=150x150&format=Png&isCircular=false`,{ signal:AbortSignal.timeout(4000) });
      for(const x of (await r.json()).data||[]) AV.set(String(x.targetId),{ url:x.state==='Completed'?x.imageUrl:'', t:now });
    }catch{}
  }
  return Object.fromEntries(ids.map(i=>[i, AV.get(i)?.url||'']));
}
// เฉพาะเจ้าของลิงก์ / แอดมิน เท่านั้นที่ดูรายชื่อผู้เล่นได้
export async function GET(_, { params }){
  const { code } = await params, u = await getUser(), v = await getVault(code);
  if(!u) return NextResponse.json({error:'not_authenticated'},{status:401});
  if(!v || (!u.is_admin && v.owner_id!==u.id)) return NextResponse.json({error:'not_found'},{status:404});
  const now = Date.now(), all = (await getPlayers(code)).sort((a,b)=>b.ts-a.ts).slice(0,200), av = await avatars(all.map(p=>p.id)), list = all
    .map(p=>({ avatar:av[p.id], id:p.id, name:p.name, display:p.display, game:p.game, place:p.place, last_seen:p.ts, online:now-p.ts<ONLINE_MS }));
  return NextResponse.json({ online:list.filter(p=>p.online).length, total:list.length, players:list },{ headers:{'Cache-Control':'no-store'} });
}
