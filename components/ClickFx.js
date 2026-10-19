'use client';
import { useEffect } from 'react';
// เอฟเฟกต์คลื่นเบาๆ ตอนกดปุ่ม (เฉพาะหน้า .fx และหน้าตรวจสอบความปลอดภัย)
export default function ClickFx(){
  useEffect(()=>{
    const h=e=>{ const b=e.target.closest?.('.fx .btn, .sc .sc-chk'); if(!b||b.disabled) return;
      const r=b.getBoundingClientRect(), d=Math.max(r.width,r.height)*1.2, s=document.createElement('span');
      s.className='rip'; s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
      b.appendChild(s); setTimeout(()=>s.remove(),600); };
    document.addEventListener('pointerdown',h); return ()=>document.removeEventListener('pointerdown',h);
  },[]);
  return null;
}
