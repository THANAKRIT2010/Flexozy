import { NextResponse } from 'next/server';
import { makeChallenge } from '@/lib/pass';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
// ออกโจทย์ proof-of-work ให้ฟอร์มสร้างลิงก์ใช้เมื่อ Turnstile ใช้ไม่ได้ (ผ่านด่าน middleware = มี fx_pass แล้ว)
export async function GET(){ return NextResponse.json({ c: await makeChallenge(), z: 4 }, { headers:{ 'cache-control':'no-store' } }); }
