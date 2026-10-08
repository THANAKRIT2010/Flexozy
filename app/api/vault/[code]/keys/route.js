import { NextResponse } from 'next/server';
import { getVault, saveVault } from '@/lib/db';
import { getUser } from '@/lib/session';
import { hk, newKey, newKeyId } from '@/lib/license';
export const dynamic='force-dynamic';
// จัดการคีย์ — เฉพาะเจ้าของลิงก์ / แอดมิน
async function guard(params){
  const { code } = await params, u = await getUser(), v = await getVault(code);
  if(!u) return { r:NextResponse.json({error:'not_authenticated'},{status:401}) };
  if(!v || (!u.is_admin && v.owner_id !== u.id)) return { r:NextResponse.json({error:'not_found'},{status:404}) };
  return { v };
}
const view = (e) => ({ id:e.id, label:e.label, prefix:e.prefix, max:e.max||1, exp:e.exp||null, revoked:!!e.revoked, devices:(e.devs||[]).length, uses:e.uses||0, last:e.last||null, created:e.created });
export async function GET(_, { params }){
  const g = await guard(params); if(g.r) return g.r;
  const names = Object.fromEntries((g.v.keys||[]).map(k=>[k.id,k.label||k.prefix]));
  return NextResponse.json({ lic:!!g.v.lic, hide:!!g.v.hide, keys:(g.v.keys||[]).map(view).reverse(),
    log:(g.v.log||[]).slice(-50).reverse().map(x=>({ n:x.n, key:names[x.k]||x.k, u:x.u, t:x.t })) }, { headers:{'Cache-Control':'no-store'} });
}
export async function POST(req, { params }){
  const g = await guard(params); if(g.r) return g.r;
  const b = await req.json().catch(()=>({})), v = g.v; v.keys ||= [];
  if(v.keys.length >= 500) return NextResponse.json({error:'too_many'},{status:400});
  const key = newKey(), max = Math.min(10, Math.max(1, parseInt(b.max)||1)), days = Math.min(3650, Math.max(0, parseInt(b.days)||0));
  const e = { id:newKeyId(), h:hk(key), prefix:key.slice(0,7), label:String(b.label||'').slice(0,60), max, exp:days?Date.now()+days*86400e3:null, created:Date.now(), devs:[], uses:0 };
  v.keys.push(e); await saveVault(v);
  return NextResponse.json({ key, ...view(e) }, { status:201 }); // คีย์จริงโชว์ครั้งเดียวเท่านั้น (เซิร์ฟเวอร์เก็บแค่ hash)
}
export async function PATCH(req, { params }){
  const g = await guard(params); if(g.r) return g.r;
  const b = await req.json().catch(()=>({})), e = (g.v.keys||[]).find(x=>x.id===b.id);
  if(!e) return NextResponse.json({error:'not_found'},{status:404});
  if(typeof b.revoked==='boolean') e.revoked = b.revoked;
  if(b.resetDevices) e.devs = [];
  await saveVault(g.v); return NextResponse.json(view(e));
}
export async function DELETE(req, { params }){
  const g = await guard(params); if(g.r) return g.r;
  const id = new URL(req.url).searchParams.get('id'); g.v.keys = (g.v.keys||[]).filter(x=>x.id!==id);
  await saveVault(g.v); return new Response(null,{status:204});
}
