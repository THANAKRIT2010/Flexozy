import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getDiscordKey, getKey, getKeyUse, saveKeyUse } from '@/lib/db';
import { kidOf, keyForDiscord, discordKeyOn, checkDiscordMember, discordBotConfigured, youtubeUrl, discordInviteUrl } from '@/lib/keys';
import { clientIp } from '@/lib/net';
export const dynamic = 'force-dynamic';
const shape = async (key) => { const kid = kidOf(key), [k, u] = await Promise.all([getKey(kid), getKeyUse(kid)]);
  return { key, revoked:!!k?.revoked, exp:k?.exp || null, scopes:k?.scopes || ['*'], claims:u.claims || 0,
    runs:u.runs || 0, bound:!!u.hwid, last_used:u.last_used || 0 }; };
// GET  → คีย์ Discord ของบัญชีที่ล็อกอินอยู่ (เต็ม ไม่ซ่อน เพราะเป็นของเจ้าของเอง) หรือ null ถ้ายังไม่มี + ลิงก์ YouTube/Discord ที่ต้องทำก่อนรับคีย์
// POST → รับคีย์: ต้องส่ง { youtube:true } (ยืนยันว่าติดตามแล้ว — ฝั่งเซิร์ฟเวอร์ไม่มีทาง verify ได้จริงโดยไม่ให้ล็อกอิน Google เพิ่ม)
//         และต้องเป็นสมาชิกเซิร์ฟเวอร์ Discord จริง (เช็กสดผ่านบอททุกครั้ง ไม่เชื่อฝั่ง client) ถึงจะออกคีย์ให้
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  if(!discordKeyOn()) return NextResponse.json({ enabled:false, key:null });
  const old = await getDiscordKey(String(u.id));
  return NextResponse.json({ enabled:true, key: old ? await shape(old) : null, youtube_url:youtubeUrl(), discord_url:discordInviteUrl() });
}
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  if(!discordKeyOn()) return NextResponse.json({ error:'disabled' }, { status:404 });
  const b = await req.json().catch(() => ({}));
  if(b.youtube !== true) return NextResponse.json({ error:'youtube_not_confirmed', message:'กรุณายืนยันว่าติดตาม YouTube แล้ว' }, { status:400 });
  if(!discordBotConfigured()) return NextResponse.json({ error:'discord_not_configured', message:'ระบบยังไม่ได้ตั้งค่าบอทตรวจสอบ Discord (DISCORD_BOT_TOKEN/DISCORD_GUILD_ID)' }, { status:503 });
  const isMember = await checkDiscordMember(String(u.id));
  if(!isMember) return NextResponse.json({ error:'not_in_discord', message:'ยังตรวจไม่พบว่าคุณเข้าร่วมเซิร์ฟเวอร์ Discord ของเรา กรุณาเข้าร่วมก่อนแล้วลองใหม่' }, { status:403 });
  const r = await keyForDiscord({ id:u.id, username:u.username, avatar:u.avatar }, clientIp(req));
  if(r.err) return NextResponse.json({ error:r.err }, { status: r.err === 'disabled' ? 404 : r.err === 'revoked' ? 403 : 400 });
  const kid = kidOf(r.key), use = await getKeyUse(kid); use.youtube_confirmed = true; use.verified_discord = true; use.gate_at ||= Date.now(); await saveKeyUse(kid, use);
  return NextResponse.json({ enabled:true, key: await shape(r.key) });
}
