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
