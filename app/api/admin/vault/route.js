import { NextResponse } from 'next/server';
import { listVaults } from '@/lib/db';
import { getUser } from '@/lib/session';
import { origin } from '@/lib/vault';
import { createVault, publicRow } from '@/lib/create';
export const dynamic='force-dynamic';
const guard = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({error:'not_found'},{status:404});
export async function GET(){
  if(!await guard()) return deny();
  const all = (await listVaults()).sort((a,b)=>b.created_at-a.created_at), o = await origin();
  return NextResponse.json({ stats:{ links:all.length, views:all.reduce((s,v)=>s+(v.views||0),0), owners:new Set(all.map(v=>v.owner_id)).size }, links:all.map(v=>publicRow(v,o)) });
}
export async function POST(req){ // แอดมิน: ตั้งโค้ดลิงก์เองได้
  const u = await guard(); if(!u) return deny();
  return createVault(req, u, { allowSlug:true });
}
