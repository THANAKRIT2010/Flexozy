import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listSec, secCounts } from '@/lib/db';
import { sealOn, doubleSeal } from '@/lib/seal';
export const dynamic = 'force-dynamic';
// สถานะระบบป้องกัน + เหตุการณ์ความปลอดภัยล่าสุด (แอดมินเท่านั้น) — ข้อมูลจริงจาก KV/ไฟล์
export async function GET(){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({ error:'not_found' }, { status:404 });
  const [events, counts] = await Promise.all([listSec(), secCounts()]);
  const env = process.env;
  const layers = [
    { id:'seal', on:sealOn(), label:'ซีลทั้งก้อน — ไม่มี Lua อ่านได้หลงเหลือเลย', hint:'guard + ชื่อตัวแปร + ตารางสลับอักษรสุ่มใหม่ทุกคำขอ — เทียบ response 2 ครั้งไม่เจอรูปแบบซ้ำ — ANTI_DUMP_SEAL=0 เพื่อปิด' },
    { id:'dseal', on:sealOn() && doubleSeal(), label:'ซีลซ้อน 2 ชั้น (v13)', hint:'เพิ่มรอบถอดรหัสก่อนเจอ Lua จริง — DOUBLE_SEAL=0 เพื่อปิด' },
    { id:'wall', on:true, label:'กำแพงหน้าเว็บ (proof-of-work' + (process.env.TURNSTILE_SECRET_KEY ? ' + Turnstile' : '') + ')', hint:'บล็อก UA ของ AI/บอทที่รู้จักทันที ที่เหลือต้องแก้โจทย์ JS ก่อนเข้าเว็บ — ' + (process.env.TURNSTILE_SECRET_KEY ? 'ใช้ Cloudflare Turnstile จริง' : 'ยังไม่ได้ตั้ง TURNSTILE_SECRET_KEY ใช้ proof-of-work เฉย ๆ') + ' — ใช้กับหน้าเว็บเท่านั้น ไม่ใช้กับ /loader ฯลฯ' },
    { id:'bind', on:env.BOOT_BIND_IP !== '0', label:'token ผูก IP + ใช้ครั้งเดียว', hint:'เอา token ที่ dump ได้ไปใช้เครื่องอื่นไม่ได้ — BOOT_BIND_IP=0 เพื่อปิดการผูก IP' },
    { id:'debt', on:true, label:'ตรวจดึง loader ซ้ำโดยไม่ใช้', hint:`เกิน ${Math.max(3, Number(env.LOADER_DEBT_MAX) || 10)} ครั้ง/10 นาที = แบน ${Math.round(Math.max(60, Number(env.LOADER_BAN_SEC) || 900) / 60)} นาที` },
    { id:'ua', on:true, label:'กรอง AI / crawler / เครื่องมือ HTTP / เบราว์เซอร์', hint:'ตอบ 403 ข้อความเดียวกันทุกกรณี' },
    { id:'rate', on:true, label:'จำกัดความถี่ต่อ IP', hint:'/loader 20 · /bootstrap-source 24 · /game-script 30 ต่อนาที' },
    { id:'proof', on:env.AUTH_PROOF !== '0', label:'Proof-of-Execution (/auth + /stage)', hint:'ต้องรัน Lua จริงถึงได้คำตอบ — บอท POST/GET ตรง ๆ ไม่ผ่าน — AUTH_PROOF=0 เพื่อปิด (ไม่แนะนำ)' },
    { id:'raw', on:sealOn(), label:'ลิงก์ทั่วไป (/raw) ใช้ระบบเดียวกับ /loader', hint:`ซีล + token ผูก IP + proof + แบนถ้าดึงเกิน ${Math.max(5, Number(env.RAW_DEBT_MAX) || 25)} ครั้ง/10 นาที` },
    { id:'strike', on:true, label:'โดนปฏิเสธซ้ำ = แบน IP อัตโนมัติ (v14)', hint:`token/proof ผิด ${Number(env.STRIKE_MAX) >= 1 ? Math.floor(Number(env.STRIKE_MAX)) : 8} ครั้งใน 10 นาที = 403 ทุก endpoint ${Math.round(Math.max(60, Number(env.LOADER_BAN_SEC) || 900) / 60)} นาที — STRIKE_MAX ปรับได้` },
    { id:'keyday', on:true, label:'จำกัดคีย์ใหม่ต่อ IP ต่อวัน (v14)', hint:`สูงสุด ${Number(env.AUTO_KEY_PER_DAY) >= 1 ? Math.floor(Number(env.AUTO_KEY_PER_DAY)) : 3} คีย์/IP/24 ชม. แล้วตอบ 429 — AUTO_KEY_PER_DAY ปรับได้` },
    { id:'bindua', on:env.TOKEN_BIND_UA !== '0', label:'token ผูก User-Agent (v14)', hint:'เอา token ไปใช้ด้วยโปรแกรมที่ UA ต่างจากตอนขอไม่ได้ — TOKEN_BIND_UA=0 เพื่อปิด' },
    { id:'autokey', on:env.AUTO_KEY === '0', label:'ปิดการแจก key อัตโนมัติ (AUTO_KEY=0)', hint:'ค่าเริ่มต้นเปิด = ใครรันก็ได้ key ฟรี 1 วัน — ถ้าต้องการกันบอทสูงสุดให้ตั้ง AUTO_KEY=0 แล้วแจก key เอง' },
    { id:'key', on:env.REQUIRE_KEY_HUB !== '0', label:'Hub ต้องใช้ key + ซ่อน URL สคริปต์', hint:'ผูก HWID — REQUIRE_KEY_HUB=0 คือปิด' },
  ];
  return NextResponse.json({ layers, events: events.slice(0, 30), counts }, { headers:{ 'cache-control':'no-store' } });
}
