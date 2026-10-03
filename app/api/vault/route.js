import { NextResponse } from 'next/server';
import { saveVault } from '@/lib/db';
import { hash, newCode, origin, rawUrl } from '@/lib/vault';
import crypto from 'crypto';
export async function POST(req){
  const b = await req.json().catch(()=>({}));
  if(process.env.CREATE_KEY && b.key !== process.env.CREATE_KEY) return NextResponse.json({error:'bad_key'},{status:401});
  if(!b.script || !String(b.script).trim()) return NextResponse.json({error:'empty_script'},{status:400});
  const salt = crypto.randomBytes(16).toString('hex'), pw = String(b.password||'').trim();
  const v = { code:newCode(), title:String(b.title||'Untitled').slice(0,120), script:String(b.script).slice(0,200000),
    salt: pw?salt:null, hash: pw?hash(pw,salt):null, views:0, created_at:Date.now() };
  await saveVault(v);
  return NextResponse.json({ code:v.code, has_password:!!pw, raw_url:rawUrl(await origin(), v.code) },{status:201});
}
