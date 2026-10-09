import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listKeys, listKeyUse } from '@/lib/db';
import { createKey, SCOPE_RE } from '@/lib/keys';
export const dynamic='force-dynamic';
const guard = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({error:'not_found'},{status:404});
export async function GET(){
  if(!await guard()) return deny();
  const [keys, use] = await Promise.all([listKeys(), listKeyUse()]);
  return NextResponse.json(keys.sort((a,b)=>b.created_at-a.created_at).map(k => { const u = use[k.kid] || {};
    return { ...k, bound: !!u.hwid, hw: u.hwid ? u.hwid.slice(0,8) : '', uses:u.uses||0, denied:u.denied||0, last_used:u.last_used||0, last_ip:u.last_ip||'', events:u.events||[] }; }));
}
export async function POST(req){ // body: { label, days (0=ไม่หมดอายุ), scopes: ['*'] | ['hub'] | ['v:CODE'], count (1-50) }
  if(!await guard()) return deny();
  const b = await req.json().catch(()=>({})), n = Math.min(50, Math.max(1, Number(b.count)||1));
  const scopes = (Array.isArray(b.scopes) ? b.scopes : ['*']).map(String).filter(s => s==='*' || s==='hub' || SCOPE_RE.test(s));
  const out = []; for(let i=0;i<n;i++) out.push((await createKey({ label:b.label, days:Number(b.days)||0, scopes:scopes.length?scopes:['*'] })).key);
  return NextResponse.json({ keys:out }, { status:201 }); // key เต็มแสดงครั้งเดียวตอนสร้างเท่านั้น (เก็บแค่ hash)
}
