export async function verifyTurnstile(token, ip){
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if(!secret) return { ok:false, error:'turnstile_not_configured' };
  if(!token) return { ok:false, error:'turnstile_required' };
  try{
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{ method:'POST',
      body:new URLSearchParams({ secret, response:token, ...(ip?{remoteip:ip}:{}) }) });
    const d = await r.json(); return d.success ? { ok:true } : { ok:false, error:'turnstile_failed' };
  }catch{ return { ok:false, error:'turnstile_unreachable' } }
}
