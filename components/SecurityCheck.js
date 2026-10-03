'use client';
import { useEffect, useState } from 'react';
const KEY='fx_sec_ok', TTL=12*3600*1000;
export default function SecurityCheck(){
  const [st,setSt]=useState('check'); // check | ok | bot | out | gone
  const [pct,setPct]=useState(0);
  const [ray]=useState(()=>Math.random().toString(16).slice(2,18));
  useEffect(()=>{
    try{ const t=+localStorage.getItem(KEY); if(t&&Date.now()-t<TTL){ setSt('gone'); return; } }catch{}
    if(navigator.webdriver||/HeadlessChrome/i.test(navigator.userAgent)){ setSt('bot'); return; }
    let i=0; const s=[18,46,73,100];
    const iv=setInterval(()=>{ setPct(s[i++]); if(i>=s.length){ clearInterval(iv); setSt('ok');
      try{localStorage.setItem(KEY,Date.now())}catch{}
      setTimeout(()=>setSt('out'),650); setTimeout(()=>setSt('gone'),1150); } },620);
    return ()=>clearInterval(iv);
  },[]);
  if(st==='gone') return null;
  const bot=st==='bot', ok=st==='ok'||st==='out';
  return (
    <div className={'sc'+(st==='out'?' out':'')}>
      <div className="sc-box">
        <img src="/images/flexozy-logo.png" alt="Flexozy" />
        <div className={'sc-ring'+(ok?' ok':'')+(bot?' stop':'')}>{ok?'✓':''}</div>
        <h1>{bot?'ตรวจพบพฤติกรรมที่น่าสงสัย':ok?'ยืนยันตัวตนสำเร็จ':'กำลังทำการตรวจสอบความปลอดภัย'}</h1>
        <p>{bot?'ไม่สามารถยืนยันได้ว่าคุณไม่ใช่บอต กรุณาลองใหม่อีกครั้งด้วยเบราว์เซอร์ปกติ'
          :ok?'กำลังพาคุณเข้าสู่เว็บไซต์...'
          :'เว็บไซต์นี้ใช้บริการรักษาความปลอดภัยเพื่อป้องกันบอตที่เป็นอันตราย หน้านี้จะปรากฏขึ้นในขณะที่เว็บไซต์ตรวจสอบว่าคุณไม่ใช่บอต'}</p>
        <div className="sc-bar"><i style={{width:pct+'%'}} /></div>
        <div className="sc-ft">Ray ID: {ray} · Flexozy Security</div>
      </div>
    </div>
  );
}
