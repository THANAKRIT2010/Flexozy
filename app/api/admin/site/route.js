import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { getSite, saveSite, resetSite, rawCounts, resolveStats, themeVars, THEMES, SOURCES, ICON_IDS } from '@/lib/site';
export const dynamic = 'force-dynamic';
const allowed = async () => !!(await getUser())?.is_admin;
const deny = () => NextResponse.json({ error:'not_found' }, { status:404 });
const NS = { 'cache-control':'no-store' };
// ตั้งค่าหน้าตาเว็บ + ตัวเลขจริงจากระบบ (ให้หลังบ้านโชว์ตัวอย่างสด)
const view = async (cfg, fresh = false) => { const raw = await rawCounts({ fresh }); return { cfg, raw, vars:themeVars(cfg), stats:resolveStats(cfg, raw), themes:THEMES, sources:SOURCES, icons:ICON_IDS }; };
export async function GET(){ if(!await allowed()) return deny(); return NextResponse.json(await view(await getSite(), true), { headers:NS }); }
export async function PUT(req){
  if(!await allowed()) return deny();
  const b = await req.json().catch(() => null);
  if(!b || typeof b !== 'object') return NextResponse.json({ error:'ข้อมูลไม่ถูกต้อง' }, { status:400 });
  try{ return NextResponse.json({ ok:true, ...(await view(await saveSite(b))) }, { headers:NS }); }
  catch{ return NextResponse.json({ error:'บันทึกไม่สำเร็จ' }, { status:500 }); }
}
export async function DELETE(){ if(!await allowed()) return deny(); return NextResponse.json({ ok:true, ...(await view(await resetSite())) }, { headers:NS }); }
