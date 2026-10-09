import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getKey, saveKey, getKeyUse, saveKeyUse, deleteKey } from '@/lib/db';
const guard = async () => { const u = await getUser(); return u?.is_admin ? u : null };
const deny = () => NextResponse.json({error:'not_found'},{status:404});
// PATCH { action: 'revoke' | 'restore' | 'reset_hwid' }
export async function PATCH(req, { params }){
  if(!await guard()) return deny();
  const { kid } = await params, k = await getKey(kid); if(!k) return deny();
  const { action } = await req.json().catch(()=>({}));
  if(action==='revoke' || action==='restore'){ k.revoked = action==='revoke'; await saveKey(k); }
  else if(action==='reset_hwid'){ const u = await getKeyUse(kid); u.hwid = null; u.events = [{ t:'hwid_reset', ts:Date.now() }, ...(u.events||[])].slice(0,30); await saveKeyUse(kid, u); }
  else return NextResponse.json({error:'bad_action'},{status:400});
  return NextResponse.json({ ok:true });
}
export async function DELETE(_, { params }){
  if(!await guard()) return deny();
  await deleteKey((await params).kid); return new Response(null,{status:204});
}
