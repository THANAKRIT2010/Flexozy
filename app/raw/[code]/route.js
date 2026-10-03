import { getVault, saveVault } from '@/lib/db';
import { isBrowser } from '@/lib/vault';
export const dynamic='force-dynamic';
const T = (s) => ({ status:s, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'} });
export async function GET(req, { params }){
  const { code } = await params, v = await getVault(code);
  if(!v) return new Response('-- [Flexozy] not found', T(404));
  // API สำหรับ executor เท่านั้น — เปิดจากเบราว์เซอร์จะไม่เห็นโค้ดจริง (ลิงก์ที่มีรหัสผ่านก็ทำงานบน executor ได้ทันที ไม่ต้องใส่รหัสใน URL)
  if(isBrowser(req)) return new Response('-- [Flexozy] This link can only be executed in-game via loadstring.', T(403));
  v.views = (v.views||0)+1; await saveVault(v);
  return new Response(v.script, T(200));
}
