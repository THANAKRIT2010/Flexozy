import { NextResponse } from 'next/server';
import { getVault } from '@/lib/db';
import { listPlayers } from '@/lib/presence';
export const dynamic = 'force-dynamic';
export async function GET(_, { params }){
  const { code } = await params;
  if(!await getVault(code)) return NextResponse.json({ error:'not_found' }, { status:404 });
  const players = await listPlayers(code);
  return NextResponse.json({ count:players.length, players }, { headers:{ 'Cache-Control':'no-store' } });
}
