import { NextResponse } from 'next/server';
import { getVault, deleteVault } from '@/lib/db';
import { getUser } from '@/lib/session';
export async function DELETE(_, { params }){
  const { code } = await params, user = await getUser(), v = await getVault(code);
  if(!user) return NextResponse.json({error:'not_authenticated'},{status:401});
  if(!v || v.owner_id !== user.id) return NextResponse.json({error:'not_found'},{status:404});
  await deleteVault(code); return new Response(null,{status:204});
}
