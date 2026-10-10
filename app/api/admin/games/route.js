import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getGameOverrides, normalizeGame, saveGameOverrides } from '@/lib/gameConfig';
import { allGames } from '@/lib/games';
import { listGameCodeIds } from '@/lib/db';
export const dynamic='force-dynamic';
const allowed=async()=>{const u=await getUser();return !!u?.is_admin};
const deny=()=>NextResponse.json({error:'not_found'},{status:404});
export async function GET(){if(!await allowed())return deny();const codes=new Set(await listGameCodeIds().catch(()=>[]));return NextResponse.json({games:(await allGames()).map(g=>({...g,has_code:codes.has(g.id)})),custom:(await getGameOverrides()).length>0});}
export async function PUT(req){
  if(!await allowed())return deny();
  const body=await req.json().catch(()=>null);
  if(!body || !Array.isArray(body.games) || body.games.length>200)return NextResponse.json({error:'ข้อมูลแมพไม่ถูกต้อง'},{status:400});
  try{
    const games=body.games.map((g,i)=>normalizeGame(g,i));
    const ids=new Set(); for(const g of games){if(ids.has(g.id))throw new Error('ชื่อแมพ/ID ซ้ำกัน: '+g.id);ids.add(g.id);}
    await saveGameOverrides(games);
    return NextResponse.json({ok:true,games});
  }catch(e){return NextResponse.json({error:e.message||'บันทึกไม่สำเร็จ'},{status:400});}
}
export async function DELETE(){if(!await allowed())return deny();await saveGameOverrides([]);return NextResponse.json({ok:true,reset:true});}
