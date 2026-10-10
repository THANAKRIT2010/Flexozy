import { NextResponse } from 'next/server';
import { BOT_RE, forbidden, looksAutomated } from './lib/bots';
import { checkPass, PASS_COOKIE } from './lib/pass';
import { challengePage } from './lib/challenge';
import { allApiHosts, hostOf } from './lib/net';
import { SecretError } from './lib/secret';
// ด่านหน้าสุดของทุกคำขอ — ทุกการปฏิเสธเครื่องมือเข้าถึงเว็บตอบ 403 ข้อความเดียวกัน
// 1) ทุกโดเมน: AI / crawler / เครื่องมือยิง HTTP (lib/bots.js) → 403 (ยกเว้น Discordbot ดูตัวอย่างลิงก์ของ "หน้าเว็บ")
// 2) โดเมนเว็บหลัก: ปิดสนิท /loader /bootstrap-info /bootstrap-source /game-script /auth → 404 (ใช้ได้เฉพาะโดเมน API หลัก/สำรอง)
//    /raw /stage /ping ยังเปิดบนโดเมนเว็บเพื่อลิงก์เก่า; หน้าเว็บต้องเหมือนเบราว์เซอร์จริง + มี cookie fx_pass
// 3) โดเมน API (API_HOST + API_FALLBACK_HOSTS): รับเฉพาะ endpoint ของ executor
// 4) คำขอแก้ข้อมูล (POST/PUT/PATCH/DELETE) บนโดเมนเว็บ ต้อง same-origin (กัน CSRF เสริมจาก SameSite)
const EXEC = /^\/(raw|stage|ping|game-script)\/|^\/auth\/?$|^\/(loader|bootstrap-info|bootstrap-source)\/?$/;
const API_ONLY = /^\/(game-script\/|auth\/?$|loader\/?$|bootstrap-info\/?$|bootstrap-source\/?$)/;
const OPEN = /^\/(api\/challenge\/verify$|images\/)/; // ต้องเปิดไว้ให้หน้า captcha ทำงานได้
const nf = () => new Response('Not Found', { status:404, headers:{ 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store', 'cdn-cache-control':'no-store' } });
export async function middleware(req){
  try{ return await run(req); }
  catch(e){ if(e instanceof SecretError) return new Response('Service unavailable', { status:503, headers:{ 'cache-control':'no-store' } }); return forbidden(); }
}
async function run(req){
  const ua = req.headers.get('user-agent')||'', path = req.nextUrl.pathname, host = hostOf(req);
  const apis = allApiHosts(), isApi = apis.includes(host), exec = EXEC.test(path);
  const preview = !isApi && !exec && !path.startsWith('/api/') && /discordbot/i.test(ua);
  if(BOT_RE.test(ua) && !preview) return forbidden();
  if(!ua && !isApi) return forbidden();
  if(isApi){
    if(req.method==='POST' && /^\/auth\/?$/.test(path)) return NextResponse.next();
    if(req.method!=='GET') return forbidden();
    if(/^\/(loader|bootstrap-info|bootstrap-source)\/?$/.test(path)) return NextResponse.next();
    if(/^\/(raw\/(vault\/)?|ping\/|stage\/)[A-Za-z0-9][A-Za-z0-9_-]{3,39}\/?$/.test(path)) return NextResponse.next();
    if(/^\/game-script\/[a-z0-9][a-z0-9-]{0,39}\/?$/.test(path)) return NextResponse.next();
    const m = path.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]{3,39})\/?$/);
    if(!m || /^(admin|settings|vault|login|logout)$/i.test(m[1])) return forbidden();
    const u = req.nextUrl.clone(); u.pathname = `/raw/${m[1]}`; return NextResponse.rewrite(u);
  }
  // ----- โดเมนเว็บ (หรือโฮสต์ที่ไม่ใช่โดเมน API) -----
  if(apis.length && API_ONLY.test(path)) return nf(); // ปิด flexozy.xyz/bootstrap-source และเพื่อน ๆ
  if(exec || preview) return NextResponse.next();
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
    const o = req.headers.get('origin');
    let okOrigin = false; try{ okOrigin = !!o && new URL(o).host.toLowerCase() === host; }catch{}
    if(!okOrigin && !(!o && req.headers.get('sec-fetch-site') === 'same-origin')) return forbidden();
  }
  if(looksAutomated(req)) return forbidden();
  if(!OPEN.test(path) && !await checkPass(req.cookies.get(PASS_COOKIE)?.value, ua))
    return path.startsWith('/api/') ? forbidden() : challengePage(host || 'flexozy.xyz');
  const vm = path.match(/^\/vault\/([^/=%]+)(?:=|%3[Dd])/);
  if(vm){ const u = req.nextUrl.clone(); u.pathname = `/vault/${vm[1]}`; return NextResponse.rewrite(u); }
  return NextResponse.next();
}
export const config = { matcher:'/((?!_next/).*)' };
