'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
// อนิเมชันเปลี่ยนหน้า: แถบโปรเกรสบน + ฉากโหลดโลโก้หมุน (โผล่เมื่อรอเกิน ~0.12 วิ) + การ์ดเอียง 3D ตามเมาส์ + เด้งเข้าตอนสลับแท็บในแดชบอร์ด
const SKIP = /^\/(raw|loader|stage|game-script|bootstrap|ping|api)/;
export default function RouteFx(){
  const path = usePathname(), [on, setOn] = useState(false), t = useRef(), bar = useRef(), st = useRef({ v:0, i:0 });
  const fin = () => { const b = bar.current; if(!b) return; clearInterval(st.current.i); b.style.transition = 'transform .2s'; b.style.transform = 'scaleX(1)'; setTimeout(() => { b.style.transition = 'opacity .35s'; b.style.opacity = '0'; }, 220); };
  useEffect(() => { clearTimeout(t.current); setOn(false); fin(); }, [path]);
  useEffect(() => {
    const go = () => { const b = bar.current, S = st.current; if(b){ S.v = 8; b.style.transition = 'none'; b.style.opacity = '1'; b.style.transform = 'scaleX(.08)'; void b.offsetWidth; clearInterval(S.i); S.i = setInterval(() => { S.v += (92 - S.v) * .09; b.style.transition = 'transform .25s ease-out'; b.style.transform = `scaleX(${S.v / 100})`; }, 200); } setOn(true); clearTimeout(t.current); t.current = setTimeout(() => setOn(false), 9000); };
    const click = (e) => { const a = e.target.closest?.('a[href]');
      if(!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if(u.origin !== location.origin || SKIP.test(u.pathname) || (u.pathname === location.pathname && u.search === location.search)) return; go(); };
    const show = (e) => { if(e.persisted) setOn(false); };
    const SEL = '.dz-card,.cf-opt,.dz-feat li,.dz-row,.pn,.ad-stat';
    const mv = (e) => { if(e.pointerType !== 'mouse') return; const c = e.target.closest?.(SEL); if(!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg');
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%'); };
    const out = (e) => { const c = e.target.closest?.(SEL); if(c && !c.contains(e.relatedTarget)){ c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } };
    const hash = () => { const p = document.querySelector('.dz-page'); if(!p) return; p.classList.remove('x-sw'); void p.offsetWidth; p.classList.add('x-sw'); };
    document.addEventListener('click', click); addEventListener('pageshow', show); document.addEventListener('pointermove', mv, { passive:true }); document.addEventListener('pointerout', out); addEventListener('hashchange', hash);
    return () => { document.removeEventListener('click', click); removeEventListener('pageshow', show); document.removeEventListener('pointermove', mv); document.removeEventListener('pointerout', out); removeEventListener('hashchange', hash); };
  }, []);
  return (<><i className="rx-bar" ref={bar}/><div className={'rx' + (on ? ' on' : '')} aria-hidden={!on} role="status">
    <div className="rx-core"><div className="rx-orb"><span/><span/><img src="/images/flexozy-logo.png" alt=""/></div><b>กำลังโหลด<em>.</em><em>.</em><em>.</em></b></div></div></>);
}
