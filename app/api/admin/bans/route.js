import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { banIp, unbanIp, listBans, validIp, logSec } from '@/lib/db';
export const dynamic = 'force-dynamic';
const admin = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({ error:'not_found' }, { status:404 });
const bad = (e = 'bad_request') => NextResponse.json({ error:e }, { status:400 });
// GET → รายการ IP ที่ถูกแบน (รวมที่ระบบแบนอัตโนมัติ) · POST {ip, hours, reason} → แบน (hours = 0 ถาวร) · DELETE {ip} → ปลดบล็อก
// การแบนมีผลกับทุกเส้นทางของสคริปต์ (/loader /raw /stage /auth) — หน้าเว็บและหลังบ้านไม่ถูกบล็อก จึงล็อกตัวเองออกจากแอดมินไม่ได้
export async function GET(){ if(!await admin()) return deny(); return NextResponse.json({ bans:await listBans() }); }
export async function POST(req){
  const adm = await admin(); if(!adm) return deny();
  const b = await req.json().catch(() => null); const ip = String(b?.ip || '').trim();
  if(!validIp(ip)) return bad('bad_ip');
  const hours = Math.min(24*365, Math.max(0, Number(b?.hours) || 0));
  const reason = String(b?.reason || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 120);
  const rec = await banIp(ip, { sec:hours * 3600, reason, by:adm.username });
  await logSec('admin_ban', '', `${adm.username} แบน ${ip} ${hours ? hours + ' ชม.' : 'ถาวร'}${reason ? ' · ' + reason : ''}`);
  return NextResponse.json({ ok:true, ban:rec });
}
export async function DELETE(req){
  const adm = await admin(); if(!adm) return deny();
  const b = await req.json().catch(() => null); const ip = String(b?.ip || '').trim();
  if(!validIp(ip)) return bad('bad_ip');
  await unbanIp(ip);
  await logSec('admin_unban', '', `${adm.username} ปลดบล็อก ${ip}`);
  return NextResponse.json({ ok:true });
}
