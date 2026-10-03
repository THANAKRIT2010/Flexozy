import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVault, saveVault } from './db';
import { hash, randomCode, SLUG_RE, origin, rawUrl } from './vault';
import { verifyTurnstile } from './turnstile';
const err = (e, s) => NextResponse.json({ error:e }, { status:s });
export async function createVault(req, user, { allowSlug }){
  const b = await req.json().catch(()=>({}));
  const ip = (req.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  const ts = await verifyTurnstile(b.turnstile, ip); if(!ts.ok) return err(ts.error,403);
  if(!b.script || !String(b.script).trim()) return err('empty_script',400);
  let code; const wanted = allowSlug ? String(b.slug||'').trim() : '';
  if(wanted){
    if(!SLUG_RE.test(wanted)) return err('bad_slug',400);
    if(await getVault(wanted)) return err('slug_taken',409);
    code = wanted;
  } else { do { code = randomCode(8) } while(await getVault(code)); }
  const salt = crypto.randomBytes(16).toString('hex'), pw = String(b.password||'').trim();
  await saveVault({ code, title:String(b.title||'Untitled').slice(0,120), script:String(b.script).slice(0,200000),
    salt:pw?salt:null, hash:pw?hash(pw,salt):null, views:0, created_at:Date.now(), owner_id:user.id, owner_name:user.username, owner_avatar:user.avatar||'' });
  return NextResponse.json({ code, has_password:!!pw, raw_url:rawUrl(await origin(), code) },{ status:201 });
}
export const publicRow = (v, o) => ({ code:v.code, title:v.title, views:v.views, has_password:!!v.hash, owner_id:v.owner_id, owner_name:v.owner_name, owner_avatar:v.owner_avatar||'', created_at:v.created_at, raw_url:rawUrl(o,v.code) });
