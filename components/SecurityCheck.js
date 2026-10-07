'use client';
import { useEffect, useState } from 'react';
const KEY='fx_sec_ok', TTL=12*3600*1000;
export default function SecurityCheck(){
  const [st,setSt]=useState('idle'); // idle | run | ok | out | gone | bot
  const [ray]=useState(()=>Math.random().toString(16).slice(2,18));
  useEffect(()=>{
    try{ const t=+localStorage.getItem(KEY); if(t&&Date.now()-t<TTL){ setSt('gone'); return; } }catch{}
    if(navigator.webdriver||/HeadlessChrome/i.test(navigator.userAgent)) setSt('bot');
  },[]);
  function go(){
    if(st!=='idle') return; setSt('run');
    setTimeout(()=>{ setSt('ok'); try{localStorage.setItem(KEY,Date.now())}catch{} },1500);
    setTimeout(()=>setSt('out'),2300); setTimeout(()=>setSt('gone'),2850);
  }
  if(st==='gone') return null;
  const bot=st==='bot', ok=st==='ok'||st==='out', run=st==='run';
  return (
    <div className={'sc'+(st==='out'?' out':'')}>
      <div className="fx-bg"/>
      <div className="sc-box">
        <img src="/images/flexozy-logo.png" alt="Flexozy"/>
        <h1>{bot?'ตรวจพบพฤติกรรมที่น่าสงสัย':ok?'ยืนยันตัวตนสำเร็จ':'ยืนยันว่าคุณเป็นมนุษย์'}</h1>
        <p>{bot?'ไม่สามารถยืนยันได้ว่าคุณไม่ใช่บอต กรุณาลองใหม่อีกครั้งด้วยเบราว์เซอร์ปกติ'
          :ok?'กำลังพาคุณเข้าสู่เว็บไซต์...'
          :'เว็บไซต์นี้ใช้ระบบรักษาความปลอดภัยเพื่อป้องกันบอต กดยืนยันด้านล่างเพื่อดำเนินการต่อ'}</p>
        {!bot && <button className={'sc-chk'+(run?' run':'')+(ok?' ok':'')} onClick={go} disabled={st!=='idle'}>
          <span className="sc-cb">{ok&&<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>}</span>
          <span className="sc-lb">{ok?'ยืนยันแล้ว':run?'กำลังตรวจสอบ...':'ฉันไม่ใช่บอต'}</span>
          <span className="sc-sh"><b>FLEXOZY</b><small>Security</small></span>
        </button>}
        {bot && <div className="sc-stop">✕ ถูกบล็อก</div>}
        <div className="sc-bar"><i style={{width:ok||run?'100%':'0%',transitionDuration:run?'1.4s':'.3s'}}/></div>
        <div className="sc-ft">Ray ID: {ray} · Flexozy Security</div>
      </div>
    </div>
  );
}
