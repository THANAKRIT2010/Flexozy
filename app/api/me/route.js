import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
export const dynamic='force-dynamic';
export async function GET(){ const u = await getUser(); return NextResponse.json(u?{authenticated:true,user:u}:{authenticated:false}); }
