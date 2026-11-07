import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVault, saveVault, hit } from './db';
import { hash, randomCode, SLUG_RE, origin, rawUrl, clientIp } from './vault';
import { verifyHuman } from './turnstile';
const RESERVED = new Set(['loader','raw','stage','ping','api','admin','settings','vault','login','logout','bootstrap-info','bootstrap-source','auth','game-script','images','_next','favicon.ico','robots.txt']);
const err = (e, s) => NextResponse.json({ error:e }, { status:s });
export async function createVault(req, user, { allowSlug }){
  const b = await req.json().catch(()=>null); if(!b || typeof b !== 'object') return err('bad_request',400);
  const ip = clientIp(req);
  // จำกัดการสร้างลิงก์ต่อผู้ใช้ (แอดมินไม่จำกัด) — กันยิง spam เต็ม KV
  if(!user.is_admin && await hit('mk:'+user.id, 3600) > 15) return err('rate_limited',429);
  const hv = await verifyHuman(b, ip); if(!hv.ok) return err(hv.error,403);
  const script = typeof b.script === 'string' ? b.script : '';
  if(!script.trim()) return err('empty_script',400);
  if(script.length > 200000) return err('too_large',413);
  let code; const wanted = allowSlug ? String(b.slug||'').trim() : '';
  if(wanted){
    if(!SLUG_RE.test(wanted) || RESERVED.has(wanted.toLowerCase())) return err('bad_slug',400);
    if(await getVault(wanted)) return err('slug_taken',409);
    code = wanted;
  } else { do { code = randomCode(8) } while(await getVault(code)); }
  const pw = typeof b.password === 'string' ? b.password.trim().slice(0,128) : '', salt = crypto.randomBytes(16).toString('hex');
  await saveVault({ code, title:String(b.title||'Untitled').replace(/[\u0000-\u001f<>]/g,'').slice(0,120) || 'Untitled', script,
    salt:pw?salt:null, hash:pw?hash(pw,salt):null, needs_key: allowSlug && user.is_admin && !!b.needs_key, views:0, created_at:Date.now(),
    owner_id:user.id, owner_name:user.username, owner_avatar:user.avatar||'' });
  return NextResponse.json({ code, has_password:!!pw, raw_url:rawUrl(await origin(), code) },{ status:201 });
}
export const publicRow = (v, o) => ({ code:v.code, title:v.title, views:v.views, has_password:!!v.hash, needs_key:!!v.needs_key, owner_id:v.owner_id, owner_name:v.owner_name, owner_avatar:v.owner_avatar||'', created_at:v.created_at, raw_url:rawUrl(o,v.code) });

// v11: แก้ลิงก์ที่สร้างแล้ว — โค้ด / ชื่อ / รหัสผ่านหน้าดูโค้ด (เปลี่ยน ตั้งใหม่ หรือลบ) ; needs_key แก้ได้เฉพาะแอดมิน
// ฟิลด์ที่ไม่ส่งมา = ไม่แตะ ; password: '' = ลบรหัสผ่าน, ข้อความ = ตั้ง/เปลี่ยน (สร้าง salt ใหม่ทุกครั้ง)
// สิทธิ์ (เจ้าของหรือแอดมิน) ตรวจที่ route ก่อนเรียกฟังก์ชันนี้
export async function updateVault(req, v, user){
  const b = await req.json().catch(()=>null); if(!b || typeof b !== 'object') return err('bad_request',400);
  if(!user.is_admin && await hit('ed:'+user.id, 60) > 20) return err('rate_limited',429);
  if('script' in b){
    if(typeof b.script !== 'string' || !b.script.trim()) return err('empty_script',400);
    if(b.script.length > 200000) return err('too_large',413);
    v.script = b.script;
  }
  if('title' in b){ if(typeof b.title !== 'string') return err('bad_request',400); v.title = b.title.replace(/[\u0000-\u001f<>]/g,'').slice(0,120) || 'Untitled'; }
  if('password' in b){
    if(typeof b.password !== 'string') return err('bad_request',400);
    const pw = b.password.trim().slice(0,128);
    if(pw){ const salt = crypto.randomBytes(16).toString('hex'); v.salt = salt; v.hash = hash(pw, salt); } else { v.salt = null; v.hash = null; }
  }
  if('needs_key' in b){ if(!user.is_admin) return err('forbidden',403); v.needs_key = !!b.needs_key; }
  v.updated_at = Date.now();
  await saveVault(v);
  return NextResponse.json({ ok:true, ...publicRow(v, await origin()) });
}
