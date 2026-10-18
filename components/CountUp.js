'use client';
import { useEffect, useRef, useState } from 'react';
// ตัวเลขค่อย ๆ นับขึ้นจาก 0 เมื่อเลื่อนมาเห็น (easeOutExpo) — ปิดอัตโนมัติถ้าผู้ใช้เปิด "ลดการเคลื่อนไหว"
export default function CountUp({ to, ms = 1800, className = '' }){
  const ref = useRef(null), [n, setN] = useState(0), [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current, target = Math.max(0, Number(to) || 0); if(!el) return;
    setDone(false);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0){ setN(target); setDone(true); return; }
    let raf, io, t0; setN(0);
    const step = (t) => { t0 ??= t; const p = Math.min((t - t0) / ms, 1); setN(Math.round(target * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)))); if(p < 1) raf = requestAnimationFrame(step); else setDone(true); };
    io = new IntersectionObserver(([e]) => { if(e.isIntersecting){ io.disconnect(); raf = requestAnimationFrame(step); } }, { threshold: .3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ms]);
  return <span ref={ref} className={'cu' + (done ? ' done' : '') + (className ? ' ' + className : '')}>{n.toLocaleString('th-TH')}</span>;
}
