import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getTokens, lockCost } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({authenticated:false});
  let tokens = null; try{ tokens = await getTokens(u.id); }catch{} // อ่านกระเป๋าไม่ได้ = ไม่ทำให้ล็อกอินพัง
  return NextResponse.json({ authenticated:true, user:u, tokens, lock_cost:lockCost() });
}
