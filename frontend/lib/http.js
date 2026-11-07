import { SecretError } from './secret';
// ครอบ route handler: ลืมตั้ง SESSION_SECRET บน production → 503 พร้อมเหตุผลใน log (ไม่ทำงานด้วยกุญแจที่เดาได้)
const H = { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store' };
export const safe = (fn) => async (...a) => {
  try{ return await fn(...a); }
  catch(e){
    if(e instanceof SecretError || e?.name === 'SecretError'){ console.error('[flexozy] SESSION_SECRET is missing or too short (min 32 chars)'); return new Response('Service unavailable', { status:503, headers:H }); }
    console.error('[flexozy] route error:', e?.message || e); return new Response('Server error', { status:500, headers:H });
  }
};
export const json = (o, s = 200, extra = {}) => new Response(JSON.stringify(o), { status:s, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...extra } });
export const notFound = () => new Response('Not Found', { status:404, headers:H });
