import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { hit } from '@/lib/db';
import { clientIp } from '@/lib/net';
import { obfuscate, LuaSyntaxError, BuildFlagError } from '@/lib/obf/pipeline';
export const dynamic = 'force-dynamic'; export const maxDuration = 60;
// สตูดิโอ obfuscate (พอร์ตจากตัวโมดูล Python ที่ให้มา — พาร์เซอร์/คอมไพเลอร์/VM runtime generator
// เป็น JS ล้วน ตรวจสอบผลลัพธ์แล้วว่าตรงกับต้นฉบับ Python 100% บน sample จริงที่รันผ่าน Luau จริง)
const MAX_INPUT = 300000; // ตัดไว้กันอินพุตใหญ่เกินไปทำให้ serverless function ช้า/timeout
const HEADER = '-- This script was generated using Flexozy 2.1.0 [https://flexozy.xyz/]\n';
export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  const ip = clientIp(req) || 'x';
  if(await hit('obf:' + ip, 60) > 8) return NextResponse.json({ error:'rate_limited', message:'ลองถี่เกินไป รอสักครู่แล้วลองใหม่' }, { status:429 });
  const b = await req.json().catch(() => ({}));
  const script = String(b.script || '');
  if(!script.trim()) return NextResponse.json({ error:'empty', message:'กรุณาวางโค้ดก่อน' }, { status:400 });
  if(script.length > MAX_INPUT) return NextResponse.json({ error:'too_large', message:`โค้ดยาวเกินไป (จำกัด ${MAX_INPUT.toLocaleString()} ตัวอักษร)` }, { status:400 });
  const preset = b.preset === 'FAST' ? 'FAST' : 'DEFAULT';
  try{
    const out = obfuscate(script, 6000000, preset);
    return NextResponse.json({ ok:true, output: HEADER + out });
  }catch(e){
    if(e instanceof LuaSyntaxError || e instanceof BuildFlagError) return NextResponse.json({ error:'syntax', message:e.message }, { status:400 });
    console.error('obfuscate failed', e);
    return NextResponse.json({ error:'internal', message:'เกิดข้อผิดพลาดระหว่างการทำงาน' }, { status:500 });
  }
}
