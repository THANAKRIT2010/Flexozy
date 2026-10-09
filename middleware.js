import { NextResponse } from 'next/server';
import { BOT_RE, forbidden, looksAutomated } from './lib/bots';
import { checkPass, PASS_COOKIE } from './lib/pass';
import { challengePage } from './lib/challenge';
// ด่านหน้าสุดของทุกคำขอ — ทุกการปฏิเสธเครื่องมือเข้าถึงเว็บตอบ 403 ข้อความเดียวกัน:
//   Unable to complete / The server denied access to the file (HTTP 403).
// 1) ทุกโดเมน ทุกหน้า: AI / crawler / เครื่องมือยิง HTTP (ดู lib/bots.js) → 403 (ยกเว้น Discordbot ดูตัวอย่างลิงก์ของ "หน้าเว็บ" ไม่รวม /raw /stage /ping /api)
//    ไม่มี User-Agent เลยเข้าเว็บหลักไม่ได้ → 403
// 2) โดเมนเว็บหลัก (ไม่ใช่ /raw /stage /ping): ต้องเหมือนเบราว์เซอร์จริง (looksAutomated) และต้องมี cookie fx_pass
//    ที่ได้จากหน้า "กำลังทำการตรวจสอบความปลอดภัย" (captcha ครั้งแรก) — ไม่มี cookie: หน้าเว็บ = หน้า captcha (403), /api = 403
// 3) โดเมน API_HOST (api.flexozy.xyz): รับเฉพาะ GET /loader /bootstrap-info /bootstrap-source, GET /raw/CODE, /stage/CODE และ /ping/CODE (และ /CODE แบบเก่า) — ส่วนอื่น 403 ทั้งหมด
// 4) /vault/CODE=ตัวอักษรสุ่ม (ที่หน้าเว็บสร้างให้ใน address bar) ถูก rewrite กลับเป็น /vault/CODE
const EXEC = /^\/(raw|stage|ping|game-script)\/|^\/auth\/?$|^\/(loader|bootstrap-info|bootstrap-source)\/?$/;
const OPEN = /^\/(api\/challenge\/verify$|images\/)/; // ต้องเปิดไว้ให้หน้า captcha ทำงานได้
export async function middleware(req){
  const ua = req.headers.get('user-agent')||'', path = req.nextUrl.pathname;
  const host = (req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(':')[0].toLowerCase();
  const api = (process.env.API_HOST || (process.env.NODE_ENV==='production' ? 'api.flexozy.xyz' : '')).toLowerCase();
  const isApi = !!api && host === api, exec = EXEC.test(path);
  const preview = !isApi && !exec && !path.startsWith('/api/') && /discordbot/i.test(ua); // Discord ดึงตัวอย่างลิงก์หน้าเว็บ
  if(BOT_RE.test(ua) && !preview) return forbidden();
  if(!ua && !isApi) return forbidden();
  if(isApi){
    if(req.method==='POST' && /^\/auth\/?$/.test(path)) return NextResponse.next(); // ขอ token ด้วย key (route เช็ค executor/rate limit เอง)
    if(req.method!=='GET') return forbidden();
    if(/^\/(loader|bootstrap-info|bootstrap-source)\/?$/.test(path)) return NextResponse.next(); // loader แบบ bootstrap (ต้องมาก่อนกฎ /CODE แบบเก่า)
    if(/^\/(raw\/(vault\/)?|ping\/|stage\/)[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
    if(/^\/game-script\/[a-z0-9][a-z0-9-]{0,39}\/?$/.test(path)) return NextResponse.next();
    const m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
    if(!m) return forbidden();
    const u = req.nextUrl.clone(); u.pathname = `/raw/${m[1]}`; return NextResponse.rewrite(u);
  }
  if(exec || preview) return NextResponse.next(); // /raw /stage /ping บนโดเมนเว็บ: route จัดการเอง (lib/vault.js denied)
  if(looksAutomated(req)) return forbidden();
  if(!OPEN.test(path) && !await checkPass(req.cookies.get(PASS_COOKIE)?.value, ua))
    return path.startsWith('/api/') ? forbidden() : challengePage(host || 'flexozy.xyz');
  const vm = path.match(/^\/vault\/([^/=%]+)(?:=|%3[Dd])/);
  if(vm){ const u = req.nextUrl.clone(); u.pathname = `/vault/${vm[1]}`; return NextResponse.rewrite(u); }
  return NextResponse.next();
}
export const config = { matcher:'/((?!_next/).*)' };
