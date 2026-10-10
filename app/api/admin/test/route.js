import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { allGames, resolveScriptId, scriptUrlById } from '@/lib/games';
import { fetchScript } from '@/lib/safeFetch';
import { buildStub } from '@/lib/stubSource';
import { makeBootToken } from '@/lib/bootToken';
import { getKey, getBoundHwid, getKeyUse, hit } from '@/lib/db';
import { kidOf, KEY_RE, keyUsable } from '@/lib/keys';
import { allApiHosts } from '@/lib/net';
import { sealOn } from '@/lib/seal';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// เครื่องมือทดสอบจริงสำหรับแอดมิน (ทุกอย่างทำงานจริง ไม่ใช่ข้อมูลตัวอย่าง) — POST { action, ... }
//   resolve  : ใส่ Place ID / Universe ID / ชื่อแมพ → ดูว่า Hub จะเลือกสคริปต์ไหน
//   script   : เซิร์ฟเวอร์ดึง Script URL ของแมพนั้นจริง → เช็กว่าเข้าถึงได้ ขนาดเท่าไร ไม่ใช่หน้า HTML
//   loader   : สร้าง /loader จริงแล้วตรวจว่าไม่มีข้อมูลรั่ว + ถอดรหัสกลับได้ + แสดงสิ่งที่คน dump จะเห็น
//   flow     : ยิง HTTP จริงเข้า API ของตัวเอง ทั้งเส้นทาง executor / token ซ้ำ / เบราว์เซอร์ / บอท
//   key      : ตรวจสถานะ key (อ่านอย่างเดียว ไม่ผูก HWID ไม่นับการใช้งาน)
const J = (o, s = 200) => NextResponse.json(o, { status:s, headers:{ 'cache-control':'no-store' } });
const num = (v) => /^\d{1,16}$/.test(String(v || '')) ? String(v) : '0';
const EXEC_UA = 'Roblox/WinInet', BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', BOT_UA = 'python-requests/2.31.0';

// ถอดซีลฝั่ง JS (ตรงกับตัวถอดรหัส Lua ใน lib/seal.js) — ใช้ยืนยันว่าข้อมูลที่ซีลถอดกลับได้ถูกต้อง
function unseal(text){
  const k = /local __K = "([0-9a-f]+)"/.exec(text)?.[1], d = /local __D = "([A-Za-z0-9+/=]*)"/.exec(text)?.[1];
  if(!k || d === undefined) return null;
  const b = Buffer.from(d, 'base64'), o = Buffer.alloc(b.length);
  for(let i = 0; i < b.length; i++) o[i] = b[i] ^ k.charCodeAt(i % k.length) ^ (((i + 1) * 7) % 256);
  return o.toString('utf8');
}
async function get(url, ua, extra = {}){
  const t = Date.now();
  try{
    const r = await fetch(url, { cache:'no-store', redirect:'manual', signal:AbortSignal.timeout(8000), headers:{ 'user-agent':ua, ...extra } });
    return { status:r.status, text:await r.text(), ms:Date.now() - t };
  }catch(e){ return { status:0, text:'', ms:Date.now() - t, error:String(e?.message || e).slice(0, 120) }; }
}
const step = (id, label, ok, detail) => ({ id, label, ok, detail });

export async function POST(req){
  const u = await getUser(); if(!u?.is_admin) return J({ error:'not_found' }, 404);
  if(await hit('admtest:' + u.id, 60) > 40) return J({ error:'rate_limited' }, 429);
  const b = await req.json().catch(() => ({})) || {};

  if(b.action === 'resolve'){
    const games = await allGames(), p = Number(num(b.placeId)), uid = Number(num(b.universeId)), name = String(b.name || '').slice(0, 120);
    const byId = (p || uid) && games.find(g => (g.placeIds || []).some(id => Number(id) === p || Number(id) === uid));
    const id = await resolveScriptId(String(uid), String(p), name), g = games.find(x => x.id === id);
    return J({ ok:true, id, name:g?.name || 'ALL MENU (ค่าเริ่มต้น)', by:byId ? 'id' : (g ? 'name' : 'default'), hasUrl:!!(await scriptUrlById(id)) });
  }

  if(b.action === 'script'){
    const id = String(b.id || ''); if(!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) return J({ ok:false, error:'รหัสแมพไม่ถูกต้อง' });
    const url = await scriptUrlById(id); if(!url) return J({ ok:false, error:'แมพนี้ยังไม่มี Script URL' });
    const t = Date.now();
    try{
      const src = await fetchScript(url, { max:3e6, timeout:8000 }), bytes = Buffer.byteLength(src), html = /^\s*</.test(src);
      return J({ ok:!html && bytes > 0, bytes, ms:Date.now() - t, error:html ? 'ได้หน้า HTML แทนที่จะเป็น Lua (URL ผิด/ไฟล์ถูกลบ/ถูกบล็อก)' : bytes ? '' : 'ไฟล์ว่าง' });
    }catch(e){ return J({ ok:false, ms:Date.now() - t, error:String(e?.message || 'ดึงไม่สำเร็จ').slice(0, 140) }); }
  }

  if(b.action === 'loader'){
    const token = makeBootToken('admin-test'), text = await buildStub(token), hosts = allApiHosts();
    const decoded = sealOn() ? unseal(text) : null, plain = decoded ?? text;
    const probes = [...hosts, 'bootstrap-source', 'bootstrap-info', token, 'HttpService', 'GetProductInfo'];
    const leaks = probes.filter(x => x && text.includes(x));
    const at = text.indexOf(sealOn() ? 'local __K' : 'local HttpService');
    return J({ ok:true, sealed:sealOn(), bytes:Buffer.byteLength(text), leaks, roundtrip:sealOn() ? !!decoded && decoded.includes('local BOOT = "' + token + '"') : null,
      innerBytes:Buffer.byteLength(plain), view:text.slice(Math.max(0, at), Math.max(0, at) + 420) });
  }

  if(b.action === 'flow'){
    const host = allApiHosts()[0];
    if(!host && process.env.NODE_ENV === 'production') return J({ ok:false, error:'ยังไม่ได้ตั้ง API_HOST' });
    const base = host ? 'https://' + host : new URL(req.url).origin, steps = [];
    const a = await get(base + '/loader', EXEC_UA);
    steps.push(step('loader', 'executor ดึง /loader', a.status === 200, a.status === 200 ? `200 · ${a.text.length.toLocaleString()} ตัวอักษร · ${a.ms} ms` : `ได้ ${a.status || 'ไม่มีการตอบกลับ'} ${a.error || ''}`.trim()));
    const inner = a.status === 200 ? (unseal(a.text) ?? a.text) : '', tok = /local BOOT = "([^"]+)"/.exec(inner)?.[1];
    steps.push(step('sealed', 'ข้อมูลใน /loader ถูกซีล (print แล้วไม่เห็นโดเมน/token)', a.status === 200 && (!sealOn() ? false : !a.text.includes('bootstrap-source') && !(tok && a.text.includes(tok))), sealOn() ? 'ซีลเปิดอยู่' : 'ปิดซีลอยู่ (ANTI_DUMP_SEAL=0)'));
    if(tok){
      const c = await get(base + '/bootstrap-source?t=' + encodeURIComponent(tok), EXEC_UA);
      steps.push(step('redeem', 'ใช้ token กับ /bootstrap-source (เส้นทางผู้ใช้จริง)', c.status === 200 && c.text.length > 1000, c.status === 200 ? `200 · ${Math.round(c.text.length / 1024)} KB · ${c.ms} ms` : `ได้ ${c.status} — ถ้า 403 อาจเพราะ IP ขาออกของเซิร์ฟเวอร์เปลี่ยนระหว่างสองคำขอ (token ผูก IP)`));
      const d = await get(base + '/bootstrap-source?t=' + encodeURIComponent(tok), EXEC_UA);
      steps.push(step('replay', 'ใช้ token ซ้ำ ต้องถูกปฏิเสธ', d.status === 403, `ได้ ${d.status}`));
    }else steps.push(step('redeem', 'ใช้ token กับ /bootstrap-source', false, 'ถอดรหัส stub เพื่อเอา token ไม่สำเร็จ'));
    const e = await get(base + '/loader', BROWSER_UA, { accept:'text/html,application/xhtml+xml', 'accept-language':'en-US', 'sec-fetch-mode':'navigate', 'sec-fetch-dest':'document' });
    steps.push(step('browser', 'เปิดด้วยเบราว์เซอร์ ต้องไม่ได้ซอส', e.status === 403 || e.status === 404, `ได้ ${e.status}`));
    const f = await get(base + '/loader', BOT_UA);
    steps.push(step('bot', 'สคริปต์/บอท (python-requests) ต้องไม่ได้ซอส', f.status === 403 || f.status === 404, `ได้ ${f.status}`));
    const g = await get(base + '/bootstrap-source', EXEC_UA);
    steps.push(step('direct', 'เรียก /bootstrap-source ตรง ๆ โดยไม่มี token ต้องไม่ได้ซอส', g.status === 403, `ได้ ${g.status}`));
    return J({ ok:steps.every(s => s.ok), base, steps });
  }

  if(b.action === 'key'){
    const key = String(b.key || '').trim().toUpperCase();
    if(!KEY_RE.test(key)) return J({ ok:false, error:'รูปแบบ key ไม่ถูกต้อง (FX-XXXX-XXXX-XXXX-XXXX)' });
    const kid = kidOf(key), k = await getKey(kid); if(!k) return J({ ok:false, error:'ไม่พบ key นี้ในระบบ' });
    const use = await getKeyUse(kid), scope = String(b.scope || 'login'), bound = await getBoundHwid(kid);
    return J({ ok:true, usable:keyUsable(k, scope), scope, revoked:!!k.revoked, expired:!!(k.exp && Date.now() > k.exp), exp:k.exp, scopes:k.scopes, label:k.label, bound:!!(bound || use.hwid), uses:use.uses || 0, denied:use.denied || 0 });
  }
  return J({ error:'bad_action' }, 400);
}
