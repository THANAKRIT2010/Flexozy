import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { banId, unbanKey, listBans, validBanKey, logSec } from '@/lib/db';
export const dynamic = 'force-dynamic';
const admin = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({ error:'not_found' }, { status:404 });
const bad = (e = 'bad_request') => NextResponse.json({ error:e }, { status:400 });
const clean = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 120);
// GET  → รายการที่ถูกแบน (IP / HWID / Roblox ID รวมที่ระบบแบนอัตโนมัติ)
// POST → { targets:[{type:'ip'|'hw'|'uid', value}], hours (0=ถาวร), reason }  หรือแบบเดิม { ip, hours, reason }
// DELETE → { k } | { ip } | { keys:[...] }  (k = ip / ::/64 / hw:<hash> / uid:<id>)
// การแบนมีผลกับทุกเส้นทางที่ส่งสคริปต์ (/loader /raw /stage /auth /ping /game-script /bootstrap-*) — IP ตรวจทุกคำขอ · HWID/Roblox ID ตรวจที่ /auth และ /ping
// IPv6 ถูกแบนทั้งช่วง /64 · หน้าเว็บและหลังบ้านไม่ถูกบล็อก จึงล็อกตัวเองไม่ได้
export async function GET(){ if(!await admin()) return deny(); return NextResponse.json({ bans:await listBans() }); }
export async function POST(req){
  const adm = await admin(); if(!adm) return deny();
  const b = await req.json().catch(() => null) || {};
  const targets = Array.isArray(b.targets) ? b.targets : (b.ip ? [{ type:'ip', value:b.ip }] : []);
  if(!targets.length || targets.length > 6) return bad('no_targets');
  const hours = Math.min(24*365, Math.max(0, Number(b.hours) || 0)), reason = clean(b.reason), done = [];
  for(const t of targets){
    try{ const rec = await banId(String(t.type), String(t.value), { sec:hours * 3600, reason, by:adm.username }); done.push(rec);
      await logSec('admin_ban', t.type === 'ip' ? t.value : '', `${adm.username} แบน ${t.type}:${String(t.value).slice(0, 14)} ${hours ? hours + ' ชม.' : 'ถาวร'}${reason ? ' · ' + reason : ''}`);
    }catch(e){ return bad(String(e.message || 'bad_request')); }
  }
  return NextResponse.json({ ok:true, bans:done });
}
export async function DELETE(req){
  const adm = await admin(); if(!adm) return deny();
  const b = await req.json().catch(() => null) || {};
  const ks = (Array.isArray(b.keys) ? b.keys : [b.k || b.ip]).map(x => String(x || '').trim()).filter(Boolean).slice(0, 10);
  if(!ks.length || !ks.every(validBanKey)) return bad('bad_key');
  for(const k of ks){ await unbanKey(k); await logSec('admin_unban', '', `${adm.username} ปลดบล็อก ${k.slice(0, 20)}`); }
  return NextResponse.json({ ok:true });
}
