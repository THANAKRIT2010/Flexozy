import { NextResponse } from 'next/server';
import { getUser, readCookie, setCookie, clearCookie } from '@/lib/session';
import { getDiscordKey, getKey, getKeyUse, saveKeyUse } from '@/lib/db';
import { kidOf, keyForDiscord, discordKeyOn, discordKeyDays, discordMemberStatus, discordBotConfigured, youtubeUrl, discordInviteUrl } from '@/lib/keys';
import { clientIp } from '@/lib/net';
export const dynamic = 'force-dynamic';
const shape = async (key) => { const kid = kidOf(key), [k, u] = await Promise.all([getKey(kid), getKeyUse(kid)]);
  return { key, revoked:!!k?.revoked, exp:k?.exp || null, scopes:k?.scopes || ['*'], claims:u.claims || 0,
    runs:u.runs || 0, bound:!!u.hwid, last_used:u.last_used || 0 }; };
// v25.13: หน้ารับคีย์แบบ "กด Start → เด้งไปหน้านั้น → กลับมานับ 10 วิ → หมุนตรวจสอบ → ผ่าน"
//   POST {action:'start',  task:'youtube'|'discord'}  → บันทึกเวลาที่กดเริ่ม (คุกกี้เซ็นแล้ว fxq อายุ 30 นาที ผูกกับบัญชี)
//   POST {action:'verify', task:'youtube'|'discord'}  → ต้องผ่านมาอย่างน้อย ~10 วิตั้งแต่กด start · discord = เช็กสดผ่านบอท v2 · youtube = ผ่านด้วยเวลา (ฝั่งเซิร์ฟเวอร์ verify การกดติดตามจริงไม่ได้)
//   POST {action:'claim'} (หรือไม่ส่ง action) → ออก/ต่ออายุคีย์: ต้องผ่าน verify youtube มาแล้ว + เช็ก Discord สดอีกรอบเสมอ
const QC = 'fxq', GATE_MS = 9000, TTL_MS = 30 * 60000;
const readQ = async (uid) => { const q = await readCookie(QC); return q && String(q.u) === String(uid) ? q : { u:String(uid) }; };
const saveQ = (q) => setCookie(QC, { u:q.u, y:q.y, d:q.d, yv:q.yv, dv:q.dv }, TTL_MS / 1000);
const fresh = (t, ms) => !!t && Date.now() - t >= ms && Date.now() - t <= TTL_MS;
const NOBOT = { error:'discord_not_configured', message:'ระบบยังไม่ได้ตั้งค่าบอทตรวจสอบ Discord (DISCORD_BOT_TOKEN_V2 / DISCORD_GUILD_ID)' };
const NOTIN = { error:'not_in_discord', message:'ยังตรวจไม่พบว่าคุณเข้าร่วมเซิร์ฟเวอร์ Discord ของเรา กรุณาเข้าร่วมก่อนแล้วลองใหม่' };
const NOCHK = { error:'discord_check_failed', message:'ตรวจสอบ Discord ไม่สำเร็จ (บอทอาจยังไม่ได้อยู่ในเซิร์ฟเวอร์) ลองใหม่อีกครั้งหรือแจ้งแอดมิน' };
// GET  → คีย์ Discord ของบัญชีที่ล็อกอินอยู่ (เต็ม ไม่ซ่อน เพราะเป็นของเจ้าของเอง) หรือ null ถ้ายังไม่มี + ลิงก์ YouTube/Discord ที่ต้องทำก่อนรับคีย์
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  if(!discordKeyOn()) return NextResponse.json({ enabled:false, key:null });
  const old = await getDiscordKey(String(u.id));
  return NextResponse.json({ enabled:true, key: old ? await shape(old) : null, youtube_url:youtubeUrl(), discord_url:discordInviteUrl(), days:discordKeyDays() });
}
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  if(!discordKeyOn()) return NextResponse.json({ error:'disabled' }, { status:404 });
  const b = await req.json().catch(() => ({})), act = b.action || 'claim', q = await readQ(u.id), task = b.task;
  if(act === 'start' || act === 'verify'){
    if(task !== 'youtube' && task !== 'discord') return NextResponse.json({ error:'bad_task' }, { status:400 });
    const sk = task === 'youtube' ? 'y' : 'd', vk = task === 'youtube' ? 'yv' : 'dv';
    if(act === 'start'){ q[sk] = Date.now(); delete q[vk]; await saveQ(q); return NextResponse.json({ ok:true }); }
    if(!fresh(q[sk], GATE_MS)) return NextResponse.json({ error:'too_early', message:'ยังไม่ครบเวลา กรุณากด Start ใหม่แล้วรอครบ 10 วินาที' }, { status:400 });
    if(task === 'discord'){
      if(!discordBotConfigured()) return NextResponse.json(NOBOT, { status:503 });
      const st = await discordMemberStatus(String(u.id));
      if(st === 'not_member') return NextResponse.json(NOTIN, { status:403 });
      if(st !== 'member') return NextResponse.json(NOCHK, { status:502 });
    }
    q[vk] = Date.now(); await saveQ(q); return NextResponse.json({ ok:true });
  }
  if(act !== 'claim') return NextResponse.json({ error:'bad_action' }, { status:400 });
  if(!fresh(q.yv, 0)) return NextResponse.json({ error:'youtube_not_confirmed', message:'กรุณาทำขั้นตอนติดตาม YouTube ให้ผ่านก่อน' }, { status:400 });
  if(!discordBotConfigured()) return NextResponse.json(NOBOT, { status:503 });
  const st = await discordMemberStatus(String(u.id)); // เช็กสดซ้ำทุกครั้งที่กดรับ/ต่ออายุ ไม่เชื่อผลเก่า
  if(st === 'not_member') return NextResponse.json(NOTIN, { status:403 });
  if(st !== 'member') return NextResponse.json(NOCHK, { status:502 });
  const r = await keyForDiscord({ id:u.id, username:u.username, avatar:u.avatar }, clientIp(req));
  if(r.err) return NextResponse.json({ error:r.err }, { status: r.err === 'disabled' ? 404 : r.err === 'revoked' ? 403 : 400 });
  const kid = kidOf(r.key), use = await getKeyUse(kid); use.youtube_confirmed = true; use.verified_discord = true; use.gate_at ||= Date.now(); await saveKeyUse(kid, use);
  await clearCookie(QC); // ใช้แล้วหมด — ต่ออายุรอบหน้าต้องทำภารกิจใหม่ทุกครั้ง
  return NextResponse.json({ enabled:true, key: await shape(r.key) });
}
