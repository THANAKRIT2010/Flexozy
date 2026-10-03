import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVault, saveVault, listVaults } from '@/lib/db';
import { hash, randomCode, SLUG_RE, origin, rawUrl } from '@/lib/vault';
import { getUser } from '@/lib/session';
import { verifyTurnstile } from '@/lib/turnstile';
export const dynamic='force-dynamic';
const err = (e, s) => NextResponse.json({ error:e }, { status:s });

export async function POST(req){
  const user = await getUser(); if(!user) return err('not_authenticated',401);
  const b = await req.json().catch(()=>({}));
  const ip = (req.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  const ts = await verifyTurnstile(b.turnstile, ip); if(!ts.ok) return err(ts.error,403);
  if(!b.script || !String(b.script).trim()) return err('empty_script',400);

  let code;
  const wanted = String(b.slug||'').trim();
  if(wanted){
    if(!user.is_admin) return err('admin_only_slug',403);           // ตั้งชื่อลิงก์เองได้เฉพาะแอดมิน
    if(!SLUG_RE.test(wanted)) return err('bad_slug',400);
    if(await getVault(wanted)) return err('slug_taken',409);
    code = wanted;
  } else {
    do { code = randomCode(8) } while(await getVault(code));        // คนทั่วไป: สุ่มอัตโนมัติ
  }
  const salt = crypto.randomBytes(16).toString('hex'), pw = String(b.password||'').trim();
  const v = { code, title:String(b.title||'Untitled').slice(0,120), script:String(b.script).slice(0,200000),
    salt:pw?salt:null, hash:pw?hash(pw,salt):null, views:0, created_at:Date.now(), owner_id:user.id, owner_name:user.username };
  await saveVault(v);
  return NextResponse.json({ code, has_password:!!pw, raw_url:rawUrl(await origin(), code) },{ status:201 });
}

export async function GET(){ // ลิงก์ของฉัน (แอดมินเห็นทั้งหมด)
  const user = await getUser(); if(!user) return err('not_authenticated',401);
  const o = await origin();
  const list = (await listVaults()).filter(v => user.is_admin || v.owner_id===user.id)
    .sort((a,b)=>b.created_at-a.created_at)
    .map(v => ({ code:v.code, title:v.title, views:v.views, has_password:!!v.hash, owner_name:v.owner_name, raw_url:rawUrl(o,v.code) }));
  return NextResponse.json(list);
}
