import { NextResponse } from 'next/server';
import { getVault, deleteVault } from '@/lib/db';
import { getUser } from '@/lib/session';
export async function DELETE(_, { params }){
  const { code } = await params, user = await getUser(), v = await getVault(code);
  if(!user) return NextResponse.json({error:'not_authenticated'},{status:401});
  if(!v) return NextResponse.json({error:'not_found'},{status:404});
  if(v.owner_id !== user.id && !user.is_admin) return NextResponse.json({error:'forbidden'},{status:403});
  await deleteVault(code); return new Response(null,{status:204});
}
