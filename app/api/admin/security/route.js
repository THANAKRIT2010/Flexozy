import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { listSec, secCounts } from '@/lib/db';
import { sealOn } from '@/lib/seal';
export const dynamic = 'force-dynamic';
// สถานะระบบป้องกัน + เหตุการณ์ความปลอดภัยล่าสุด (แอดมินเท่านั้น) — ข้อมูลจริงจาก KV/ไฟล์
export async function GET(){
  const u = await getUser(); if(!u?.is_admin) return NextResponse.json({ error:'not_found' }, { status:404 });
  const [events, counts] = await Promise.all([listSec(), secCounts()]);
  const env = process.env;
  const layers = [
    { id:'seal', on:sealOn(), label:'ซีล /loader', hint:'print(HttpGet) ไม่เห็นโดเมน/token/ตารางเกม — ANTI_DUMP_SEAL=0 เพื่อปิด' },
    { id:'bind', on:env.BOOT_BIND_IP !== '0', label:'token ผูก IP + ใช้ครั้งเดียว', hint:'เอา token ที่ dump ได้ไปใช้เครื่องอื่นไม่ได้ — BOOT_BIND_IP=0 เพื่อปิดการผูก IP' },
    { id:'debt', on:true, label:'ตรวจดึง loader ซ้ำโดยไม่ใช้', hint:`เกิน ${Math.max(3, Number(env.LOADER_DEBT_MAX) || 10)} ครั้ง/10 นาที = แบน ${Math.round(Math.max(60, Number(env.LOADER_BAN_SEC) || 900) / 60)} นาที` },
    { id:'hook', on:env.ANTI_DUMP_STRICT !== '0', label:'ตรวจฮุก loadstring / HttpGet ในเกม', hint:'เตะผู้เล่นที่ฮุกฟังก์ชันก่อนถอดรหัส — ANTI_DUMP_STRICT=0 ถ้าเตะผิดคน' },
    { id:'ua', on:true, label:'กรอง AI / crawler / เครื่องมือ HTTP / เบราว์เซอร์', hint:'ตอบ 403 ข้อความเดียวกันทุกกรณี' },
    { id:'rate', on:true, label:'จำกัดความถี่ต่อ IP', hint:'/loader 20 · /bootstrap-source 24 · /game-script 30 ต่อนาที' },
    { id:'proof', on:env.AUTH_PROOF !== '0', label:'Proof-of-Execution (/auth + /stage)', hint:'ต้องรัน Lua จริงถึงได้คำตอบ — บอท POST/GET ตรง ๆ ไม่ผ่าน — AUTH_PROOF=0 เพื่อปิด (ไม่แนะนำ)' },
    { id:'raw', on:sealOn(), label:'ลิงก์ทั่วไป (/raw) ใช้ระบบเดียวกับ /loader', hint:`ซีล + token ผูก IP + proof + แบนถ้าดึงเกิน ${Math.max(5, Number(env.RAW_DEBT_MAX) || 25)} ครั้ง/10 นาที` },
    { id:'thread', on:env.ANTI_DUMP_THREADS !== '0', label:'ตรวจฮุก thread + watchdog 2 ทาง', hint:'task.* / coroutine.* + loop/Heartbeat นับรอบกัน — ANTI_DUMP_THREADS=0 ถ้าเตะผิดคน' },
    { id:'autokey', on:env.AUTO_KEY === '0', label:'ปิดการแจก key อัตโนมัติ (AUTO_KEY=0)', hint:'ค่าเริ่มต้นเปิด = ใครรันก็ได้ key ฟรี 1 วัน — ถ้าต้องการกันบอทสูงสุดให้ตั้ง AUTO_KEY=0 แล้วแจก key เอง' },
    { id:'key', on:env.REQUIRE_KEY_HUB !== '0', label:'Hub ต้องใช้ key + ซ่อน URL สคริปต์', hint:'ผูก HWID — REQUIRE_KEY_HUB=0 คือปิด' },
  ];
  return NextResponse.json({ layers, events: events.slice(0, 30), counts }, { headers:{ 'cache-control':'no-store' } });
}
