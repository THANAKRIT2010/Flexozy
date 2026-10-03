'use client';
import { useEffect, useRef, useState } from 'react';
// Cloudflare's real widget issues a token. Its appearance is controlled by Cloudflare.
export default function Turnstile({ onToken }){
  const ref=useRef(null), callback=useRef(onToken), [error,setError]=useState('');
  useEffect(()=>{callback.current=onToken},[onToken]);
  useEffect(()=>{
    let id, cancelled=false;
    const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if(!sitekey){ setError('ยังไม่ได้ตั้งค่า Turnstile site key'); return }
    const render=()=>{
      if(cancelled||!ref.current||!window.turnstile) return;
      try{id=window.turnstile.render(ref.current,{sitekey,theme:'dark',language:'th',callback:t=>callback.current(t),
        'expired-callback':()=>callback.current(''), 'error-callback':()=>{callback.current('');setError('ตรวจสอบไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่')} });}
      catch{setError('โหลดการตรวจสอบไม่สำเร็จ')}
    };
    if(window.turnstile) render();
    else {let script=document.querySelector('script[data-flexozy-turnstile]');
      if(!script){script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.dataset.flexozyTurnstile='';document.head.appendChild(script)}
      script.addEventListener('load',render);return ()=>{cancelled=true;script.removeEventListener('load',render);if(id!==undefined) try{window.turnstile?.remove(id)}catch{}};
    }
    return ()=>{cancelled=true;if(id!==undefined) try{window.turnstile?.remove(id)}catch{}};
  },[]);
  return <div className="turnstile-area"><div ref={ref}/>{error&&<span className="err" role="alert">{error}</span>}</div>;
}
