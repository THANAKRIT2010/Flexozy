import { NextResponse } from 'next/server';
import { getVault } from '@/lib/db';
import { origin, rawUrl, needsKey } from '@/lib/vault';
import { getUser } from '@/lib/session';
import { safe } from '@/lib/http';
export const dynamic='force-dynamic';
export const GET = safe(async (_, { params }) => {
  const { code } = await params; if(!/^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$/.test(code)) return NextResponse.json({error:'not_found'},{status:404});
  const v = await getVault(code), u = await getUser();
  if(!v) return NextResponse.json({error:'not_found'},{status:404});
  const can = !!u && (u.is_admin || u.id === v.owner_id);
  return NextResponse.json({ code, title:v.title, views:v.views, has_password:!!v.hash, needs_key:needsKey(v), can_manage:can, locked_by_key:needsKey(v) && !can, raw_url:rawUrl(await origin(), code) });
});
