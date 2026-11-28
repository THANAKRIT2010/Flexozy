import { NextResponse, after } from 'next/server';
import { getUser } from '@/lib/session';
import { hit, saveObfJob, getObfJob } from '@/lib/db';
import { clientIp } from '@/lib/net';
import { obfuscate, LuaSyntaxError, BuildFlagError } from '@/lib/obf/pipeline';
// Vercel Blob ใช้เก็บ output ที่ใหญ่เกิน KV (ดู INLINE_LIMIT ด้านล่าง) — ต้อง `npm install @vercel/blob`
// และสร้าง private blob store ผูกกับโปรเจกต์ก่อน (`vercel blob create-store <ชื่อ> --access private --yes`)
// ไม่งั้น import นี้จะล้มเหลวตอน build — ถ้ายังไม่ได้ตั้งค่า ให้ comment บรรทัดนี้ออกชั่วคราวและ
// สคริปต์ที่ output ใหญ่เกิน INLINE_LIMIT จะได้ error ชัดเจนแทนที่จะพังแบบงงๆ (ดู catch ใน after() ด้านล่าง)
import { put, issueSignedToken, presignUrl } from '@vercel/blob';
export const dynamic = 'force-dynamic';
// Hobby: max duration ที่ตั้งได้คือ 300s (เท่ากับ default อยู่แล้ว) · Pro/Ent (เปิด Fluid compute):
// ตั้งได้ถึง 800s ปกติ หรือ 1800s (extended, beta) — ถ้าสคริปต์ 700K+ ตัวอักษรยังไม่พอ ให้พิจารณาอัปเกรดแพลน
export const maxDuration = 290;
// สตูดิโอ obfuscate (พอร์ตจากตัวโมดูล Python ที่ให้มา — พาร์เซอร์/คอมไพเลอร์/VM runtime generator
// เป็น JS ล้วน ตรวจสอบผลลัพธ์แล้วว่าตรงกับต้นฉบับ Python 100% บน sample จริงที่รันผ่าน Luau จริง)
const MAX_INPUT = 300000; // ผู้ใช้ทั่วไป: จำกัด 300,000 ตัวอักษร (กันอินพุตใหญ่เกินไปทำให้ serverless function ช้า/timeout) · แอดมิน: ไม่จำกัด
const HEADER = '-- This script was generated using Flexozy 2.1.0 [https://flexozy.xyz/]\n';
// เดิม: POST รอ obfuscate() ทำงานจนจบแล้วค่อยตอบ response เดียว — ถ้าโค้ดยาวและใช้เวลานาน มีโอกาสโดน
// proxy/host/เบราว์เซอร์ตัดคำขอก่อนเสร็จ (ไม่ใช่เน็ตเวิร์กหลุดจริง) ทำให้ fetch() ฝั่ง client โยน error
// ใหม่: แยกเป็น 2 ขั้น — POST สร้าง "job" แล้วตอบกลับทันที (ไม่รอ) ส่วนงานหนักไปรันเบื้องหลังด้วย
// after() (Next.js >=15.1) ซึ่งทำให้ function ยังมีชีวิตอยู่ทำงานต่อได้แม้ response ถูกส่งไปแล้ว
// ฝั่ง client แค่ poll ผลลัพธ์เป็นระยะด้วย GET (คำขอสั้นๆ ไม่มีทางค้างจนโดนตัด) จนกว่า job จะเสร็จ
// หมายเหตุสำคัญ: ตัวอัลกอริทึมและ preset ไม่เปลี่ยนแปลงเลย (ยังเป็น DEFAULT 3 รอบ ratio เหมือนเดิม
// ทุกประการ) การแก้นี้แก้แค่ "รูปแบบการคุยกับ server" ไม่ได้ลดงานหรือคุณภาพผลลัพธ์แต่อย่างใด
// ข้อจำกัดที่ยังอยู่: ถ้า obfuscate() ใช้เวลารวมนานกว่าขีดจำกัดจริงของแพลน hosting งานเบื้องหลังก็ยัง
// โดนตัดได้เหมือนเดิม เพียงแต่กรณีนี้จะเกิดเฉพาะตอนที่ "คำนวณจริงๆ นานเกินไป" ไม่ใช่ทุกครั้งที่โค้ดยาว
const JOB_TTL_MS = 9 * 60 * 1000; // job เก่าเกิน 9 นาทียังไม่เสร็จ ถือว่าหมดเวลา (ต้องน้อยกว่า maxDuration เสมอ)
// output ของสคริปต์ขนาดใหญ่ (เช่น ~700K ตัวอักษร) อาจยาวถึงหลักร้อย MB เพราะ control-flow flattening
// ที่ทำกับทุกคำสั่งเสมอ (ไม่ใช่แค่ decoy ที่ปรับได้) — ค่านี้ไม่เกี่ยวกับคุณภาพ แค่เป็นเส้นแบ่งว่าจะเก็บ
// output ไว้ใน KV ตรงๆ (เหมือนเดิมทุกประการสำหรับสคริปต์ขนาดปกติ) หรือฝากไว้ที่ Vercel Blob แล้วส่งแค่
// ลิงก์ดาวน์โหลดกลับไป (เพราะ KV และ response ของ Vercel Function มีเพดานขนาดเพียงไม่กี่ MB)
const INLINE_LIMIT = 3 * 1024 * 1024; // 3MB

export async function POST(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  const ip = clientIp(req) || 'x';
  if(await hit('obf:' + ip, 60) > 8) return NextResponse.json({ error:'rate_limited', message:'ลองถี่เกินไป รอสักครู่แล้วลองใหม่' }, { status:429 });
  const b = await req.json().catch(() => ({}));
  const script = String(b.script || '');
  if(!script.trim()) return NextResponse.json({ error:'empty', message:'กรุณาวางโค้ดก่อน' }, { status:400 });
  if(!u.is_admin && script.length > MAX_INPUT) return NextResponse.json({ error:'too_large', message:`โค้ดยาวเกินไป (จำกัด ${MAX_INPUT.toLocaleString()} ตัวอักษร)` }, { status:400 });
  const preset = b.preset === 'FAST' ? 'FAST' : 'DEFAULT'; // ไม่เปลี่ยนพฤติกรรม — เคารพค่าที่ client ส่งมาเท่านั้น เหมือนเดิมทุกประการ

  const jobId = crypto.randomUUID();
  await saveObfJob(jobId, { status:'pending', uid:u.id, createdAt:Date.now() });

  // งานหนัก (parse/compile/สร้าง runtime) ไปรันเบื้องหลัง — ไม่ await ตรงนี้ จึงไม่ถ่วงการตอบ response
  after(async () => {
    try{
      // แอดมินไม่จำกัดความยาว → เพดานผลลัพธ์ของตัวสร้างก็ขยายตามขนาดอินพุตด้วย (ผู้ใช้ทั่วไปใช้ค่าเดิม 6,000,000)
      const out = obfuscate(script, u.is_admin ? Math.max(6000000, script.length * 40) : 6000000, preset);
      const full = HEADER + out;
      if(full.length <= INLINE_LIMIT){
        // ขนาดปกติ (ส่วนใหญ่ของสคริปต์ทั่วไป) — เก็บตรงใน KV และแสดงผลแบบเดิมทุกประการ ไม่มีอะไรเปลี่ยน
        await saveObfJob(jobId, { status:'done', uid:u.id, output: full, createdAt:Date.now() });
      }else{
        // ใหญ่เกิน KV ไหว — อัปโหลดเป็นไฟล์ไปที่ Vercel Blob (private) แล้วออก signed URL ให้ client
        // ดาวน์โหลดตรงจาก blob ได้เลย ไม่ต้องยัดเนื้อไฟล์ทั้งหมดผ่าน response ของ function นี้อีกที
        const blob = await put(`obf/${jobId}.lua`, full, { access:'private', addRandomSuffix:true, contentType:'text/x-lua' });
        const validUntil = Date.now() + 30 * 60 * 1000; // ลิงก์ดาวน์โหลดหมดอายุใน 30 นาที
        const token = await issueSignedToken({ pathname: blob.pathname, operations:['get'], validUntil });
        const { presignedUrl } = await presignUrl(token, { pathname: blob.pathname, operation:'get', validUntil });
        await saveObfJob(jobId, { status:'done', uid:u.id, downloadUrl: presignedUrl, outputLength: full.length, createdAt:Date.now() });
      }
    }catch(e){
      if(e instanceof LuaSyntaxError || e instanceof BuildFlagError){
        await saveObfJob(jobId, { status:'error', uid:u.id, error:'syntax', message:e.message, createdAt:Date.now() });
      }else{
        console.error('obfuscate failed', e);
        await saveObfJob(jobId, { status:'error', uid:u.id, error:'internal', message:'เกิดข้อผิดพลาดระหว่างการทำงาน', createdAt:Date.now() });
      }
    }
  });

  return NextResponse.json({ ok:true, jobId });
}

// ฝั่ง client เรียกซ้ำเป็นระยะด้วย GET /api/obfuscate?job=<jobId> จนกว่าจะได้ status 'done' หรือ 'error'
export async function GET(req){
  const u = await getUser(); if(!u) return NextResponse.json({ error:'not_authenticated' }, { status:401 });
  const jobId = new URL(req.url).searchParams.get('job');
  if(!jobId) return NextResponse.json({ error:'missing_job', message:'ไม่พบหมายเลขงาน' }, { status:400 });
  const job = await getObfJob(jobId);
  if(!job || job.uid !== u.id) return NextResponse.json({ error:'not_found', message:'ไม่พบงานนี้ หรือหมดเวลาแล้ว' }, { status:404 });
  if(job.status === 'pending' && Date.now() - job.createdAt > JOB_TTL_MS){
    return NextResponse.json({ error:'timeout', message:'การประมวลผลใช้เวลานานเกินไป ลองใหม่อีกครั้ง' }, { status:408 });
  }
  if(job.status === 'done'){
    return job.downloadUrl
      ? NextResponse.json({ ok:true, status:'done', downloadUrl: job.downloadUrl, outputLength: job.outputLength })
      : NextResponse.json({ ok:true, status:'done', output: job.output });
  }
  if(job.status === 'error') return NextResponse.json({ ok:false, status:'error', error:job.error, message:job.message }, { status:400 });
  return NextResponse.json({ ok:true, status:'pending' });
}
