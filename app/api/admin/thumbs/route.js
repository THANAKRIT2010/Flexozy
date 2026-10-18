import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
export const dynamic='force-dynamic';
// ไอคอนแมพจาก Roblox ผ่านเซิร์ฟเวอร์ (เดิมเบราว์เซอร์ยิงตรง ซึ่ง Roblox ไม่เปิด CORS ให้ → ไอคอนไม่ขึ้น) + แคช 1 ชม.
const CACHE = globalThis.__fxThumb ||= new Map(), UCACHE = globalThis.__fxThumbU ||= new Map();
export async function GET(req){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const users = new URL(req.url).searchParams.get('kind') === 'users';
  const ids = [...new Set((new URL(req.url).searchParams.get('ids')||'').split(',').filter(x => /^\d{1,16}$/.test(x)))].slice(0, 100), now = Date.now();
  const CACHE_ = users ? UCACHE : CACHE;
  const need = ids.filter(i => !(CACHE_.get(i)?.t > now - 3600e3));
  if(need.length){
    try{
      const r = await fetch(users ? `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${need.join(',')}&size=150x150&format=Png&isCircular=false` : `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${need.join(',')}&size=150x150&format=Png&isCircular=false`, { signal:AbortSignal.timeout(5000) });
      for(const x of (await r.json()).data || []) CACHE_.set(String(x.targetId), { t:now, url:x.state === 'Completed' && /^https:\/\/[a-z0-9.-]*rbxcdn\.com\//.test(x.imageUrl||'') ? x.imageUrl : '' });
    }catch{}
  }
  return NextResponse.json(Object.fromEntries(ids.map(i => [i, CACHE_.get(i)?.url || ''])));
}
