import { NextResponse } from 'next/server';
import { getVault, deleteVault } from '@/lib/db';
import { getUser } from '@/lib/session';
export async function DELETE(_, { params }){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const { code } = await params; if(!await getVault(code)) return NextResponse.json({error:'not_found'},{status:404});
  await deleteVault(code); return new Response(null,{status:204});
}
