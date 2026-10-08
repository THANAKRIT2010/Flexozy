import { NextResponse } from 'next/server';
import { getVault, saveVault } from '@/lib/db';
import { checkPw, isBot } from '@/lib/vault';
export async function POST(req, { params }){
  if(isBot(req)) return NextResponse.json({error:'not_found'},{status:404}); // AI/บอท/เครื่องมือยิง HTTP → 404
  const { code } = await params, v = await getVault(code);
  if(!v) return NextResponse.json({error:'not_found'},{status:404});
  const { password } = await req.json().catch(()=>({}));
  if(!checkPw(v, password)) return NextResponse.json({error:'wrong_password'},{status:401});
  v.views = (v.views||0)+1; await saveVault(v);
  return NextResponse.json({ title:v.title, script:v.script });
}
