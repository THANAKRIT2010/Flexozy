'use client';
import { useEffect, useRef, useState } from 'react';
// ตรวจว่าเป็นคนก่อนสร้างลิงก์: Cloudflare Turnstile ก่อน — ถ้าไม่ได้ตั้งค่า/ถูกบล็อก/โหลดไม่ขึ้นใน 12 วิ → proof-of-work ในเบราว์เซอร์ (≈1 วิ) แทน
// onChange(payload | null): payload = { turnstile } หรือ { pow:{c,n} } — ส่งไปกับ body ของ POST
async function solve(c, z){
  const enc = new TextEncoder(), B = 512; let n = 0;
  for(;;){
    const r = await Promise.all(Array.from({ length:B }, async (_, i) => { const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${c}:${n+i}`)));
      for(let k = 0; k < z; k++) if(((d[k>>1] >> (k%2 ? 0 : 4)) & 15) !== 0) return false; return true; }));
    const j = r.indexOf(true); if(j >= 0) return n + j; n += B;
  }
}
export default function Turnstile({ onChange }){
  const ref = useRef(), [state, setState] = useState('checking');
  useEffect(()=>{
    let dead = false, wid, timer; const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const pow = async () => { try{
      setState('pow'); const r = await fetch('/api/pow', { cache:'no-store' }); const { c, z } = await r.json(); const n = await solve(c, z);
      if(!dead){ onChange({ pow:{ c, n } }); setState('ok'); } }catch{ if(!dead) setState('error'); } };
    if(!site || !crypto?.subtle){ pow(); return ()=>{ dead = true }; }
    const render = () => { if(dead || !window.turnstile) return; wid = window.turnstile.render(ref.current, { sitekey:site, theme:'dark', language:'th',
      callback:(t)=>{ clearTimeout(timer); onChange({ turnstile:t }); setState('ok'); }, 'expired-callback':()=>{ onChange(null); setState('checking'); }, 'error-callback':()=>{ clearTimeout(timer); pow(); } }); };
    timer = setTimeout(()=>{ if(!dead) pow(); }, 12000);
    if(window.turnstile) render();
    else { const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = render;
      s.onerror = ()=>{ clearTimeout(timer); pow(); }; document.head.appendChild(s); }
    return ()=>{ dead = true; clearTimeout(timer); try{ window.turnstile?.remove(wid) }catch{} };
  },[]);
  // ซ่อนกล่องทั้งหมดเมื่อผ่าน/กำลังตรวจแบบเงียบ — โชว์เฉพาะตอนต้องกดโจทย์ของ Cloudflare หรือเกิดข้อผิดพลาด
  const quiet = state === 'ok' || state === 'pow';
  return <div className="ts-box" style={quiet ? { display:'none' } : undefined}><div ref={ref} style={{ minHeight: state === 'checking' ? 65 : 0 }}/>
    {state === 'error' && <span className="ts-note bad">ตรวจสอบไม่สำเร็จ — รีเฟรชหน้าแล้วลองใหม่</span>}</div>;
}
