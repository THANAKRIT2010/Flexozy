import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listTopups } from '@/lib/db';
import { shopMobile } from '@/lib/truemoney';
export const dynamic = 'force-dynamic';
export async function GET(){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  return NextResponse.json({ enabled:process.env.TOPUP_TM !== '0' && !!shopMobile(), rate:Math.max(1, Number(process.env.TOKEN_PER_BAHT) || 100), history:await listTopups(String(u.id)).catch(() => []) });
}
