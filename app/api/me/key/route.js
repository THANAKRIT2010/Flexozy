import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getDiscordKey, getKey, getKeyUse } from '@/lib/db';
import { kidOf, keyForDiscord, discordKeyOn } from '@/lib/keys';
import { clientIp } from '@/lib/net';
export const dynamic = 'force-dynamic';
const shape = async (key) => { const kid = kidOf(key), [k, u] = await Promise.all([getKey(kid), getKeyUse(kid)]);
  return { key, revoked:!!k?.revoked, exp:k?.exp || null, scopes:k?.scopes || ['*'], claims:u.claims || 0,
    runs:u.runs || 0, bound:!!u.hwid, last_used:u.last_used || 0 }; };
// GET  → คีย์ Discord ของบัญชีที่ล็อกอินอยู่ (เต็ม ไม่ซ่อน เพราะเป็นของเจ้าของเอง) หรือ null ถ้ายังไม่มี
// POST → เคลม/ออกคีย์ใหม่ด้วยตัวเอง (เผื่อตอนล็อกอินออกให้ไม่สำเร็จ) — กันสแปมด้วย session เดียวกันจึงเรียกได้ไม่บ่อยอยู่แล้ว
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  if(!discordKeyOn()) return NextResponse.json({ enabled:false, key:null });
  const old = await getDiscordKey(String(u.id));
  return NextResponse.json({ enabled:true, key: old ? await shape(old) : null });
}
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  const r = await keyForDiscord({ id:u.id, username:u.username, avatar:u.avatar }, clientIp(req));
  if(r.err) return NextResponse.json({ error:r.err }, { status: r.err === 'disabled' ? 404 : r.err === 'revoked' ? 403 : 400 });
  return NextResponse.json({ enabled:true, key: await shape(r.key) });
}
