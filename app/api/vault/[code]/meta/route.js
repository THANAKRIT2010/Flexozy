import { NextResponse } from 'next/server';
import { getVault } from '@/lib/db';
import { origin, rawUrl } from '@/lib/vault';
import { getUser } from '@/lib/session';
export async function GET(_, { params }){
  const { code } = await params, v = await getVault(code), u = await getUser();
  if(!v) return NextResponse.json({error:'not_found'},{status:404});
  return NextResponse.json({ code, title:v.title, views:v.views, has_password:!!v.hash, can_manage:!!u&&(u.is_admin||u.id===v.owner_id), raw_url:rawUrl(await origin(), code) });
}
