import { denied } from '@/lib/vault';
import { buildLoader } from '@/lib/loaderSource';
export const dynamic = 'force-dynamic';
// GET /bootstrap-source — ตัวหลัก (GUI โหลด + ส่งสถิติ + รันสคริปต์ของเกม) อ่าน getgenv().FlexozyScriptId
export async function GET(req){
  const d = denied(req); if(d) return d;
  return new Response(await buildLoader(), { status:200, headers:{
    'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex' } });
}
