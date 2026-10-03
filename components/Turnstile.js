'use client';
import { useEffect, useRef } from 'react';
// Cloudflare Turnstile — ต้องผ่านการตรวจสอบก่อนจึงกดสร้างลิงก์ได้
export default function Turnstile({ onToken }){
  const ref = useRef();
  useEffect(()=>{
    let id; const render = () => { id = window.turnstile.render(ref.current,{ sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, theme:'dark', language:'th',
      callback:onToken, 'expired-callback':()=>onToken(''), 'error-callback':()=>onToken('') }); };
    if(window.turnstile) render();
    else { const s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async=true; s.onload=render; document.head.appendChild(s); }
    return ()=>{ try{ window.turnstile?.remove(id) }catch{} };
  },[]);
  return <div ref={ref} style={{marginTop:16,minHeight:65}} />;
}
