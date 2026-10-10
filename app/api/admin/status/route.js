import { NextResponse } from 'next/server';
import { getUser, ADMIN_IDS } from '@/lib/session';
import { secretReady } from '@/lib/secret';
import { dbInfo } from '@/lib/db';
import { turnstileConfigured } from '@/lib/turnstileCore';
import { primaryApiHost, fallbackApiHosts, webHost } from '@/lib/net';
import { hubKeyed } from '@/lib/loaderSource';
export const dynamic='force-dynamic';
// สถานะการตั้งค่า/ความปลอดภัยของระบบ (แอดมินเท่านั้น) — ไม่คืนค่าความลับ แค่บอกว่าตั้งแล้วหรือยัง
export async function GET(){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({error:'not_found'},{status:404});
  const db = dbInfo(), prod = process.env.NODE_ENV === 'production';
  const hosts = [primaryApiHost(), ...fallbackApiHosts()].filter(Boolean);
  const checks = [
    { id:'secret', ok:secretReady(), label:'SESSION_SECRET (≥ 32 ตัวอักษร)', fix:'ตั้งค่าสุ่มยาว ๆ ใน Environment Variables' },
    { id:'kv', ok:db.kind === 'kv', label:'Vercel KV (ข้อมูลถาวร + rate limit ข้าม instance)', fix:'ตั้ง KV_REST_API_URL / KV_REST_API_TOKEN — ไม่งั้นข้อมูลหายเมื่อ instance รีสตาร์ท' },
    { id:'admin', ok:ADMIN_IDS().length > 0, label:'ADMIN_DISCORD_IDS', fix:'ใส่ Discord ID ของแอดมิน คั่นด้วย ,' },
    { id:'discord', ok:!!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_REDIRECT_URI), label:'Discord OAuth', fix:'ตั้ง DISCORD_CLIENT_ID / SECRET / REDIRECT_URI' },
    { id:'ts', ok:turnstileConfigured(), label:'Cloudflare Turnstile (ไม่บังคับ — ไม่ตั้ง/ถูกบล็อกจะใช้ proof-of-work แทน)', fix:'ตั้ง TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY', optional:true },
    { id:'failover', ok:hosts.length > 1, label:'โดเมนสำรองกรณี Cloudflare บล็อก (API_FALLBACK_HOSTS)', fix:'ใส่โดเมนสำรอง เช่น your-app.vercel.app', optional:true },
    { id:'hub', ok:hubKeyed(), label:'Hub ต้องใช้ key + ซ่อน URL สคริปต์', fix:'อย่าตั้ง REQUIRE_KEY_HUB=0' },
  ];
  return NextResponse.json({ prod, db, hosts, web:webHost(), checks, keyedHub:hubKeyed() });
}
