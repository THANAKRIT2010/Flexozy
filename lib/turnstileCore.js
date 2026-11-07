// ส่วนของ Turnstile ที่ใช้ได้ทั้ง Edge/Node (ไม่แตะ db)
export const turnstileConfigured = () => !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
// คืน 'ok' | 'failed' | 'unreachable' (unreachable = Cloudflare ถูกบล็อก/ล่ม → ผู้เรียกตัดสินใจใช้ทางสำรอง)
export async function siteverify(token, ip){
  try{
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', signal:AbortSignal.timeout(5000),
      body:new URLSearchParams({ secret:process.env.TURNSTILE_SECRET_KEY, response:String(token), ...(ip?{remoteip:ip}:{}) }) });
    const d = await r.json(); return d.success ? 'ok' : 'failed';
  }catch{ return 'unreachable' }
}
