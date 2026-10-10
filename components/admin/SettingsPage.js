'use client';
import { useEffect, useState } from 'react';
import GameManager from '../GameManager';
import { failover, ls } from '@/lib/snippets';
import { copyText } from '../LinkForm';
export default function SettingsPage(){
  const [s,setS]=useState(null), [cp,setCp]=useState('');
  useEffect(()=>{ fetch('/api/admin/status',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setS).catch(()=>{}); },[]);
  const copy=(t,k)=>{copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  const hosts = s?.hosts || [], snippet = hosts.length ? (hosts.length>1 ? failover(hosts,'/loader') : ls('https://'+hosts[0]+'/loader')) : '';
  return (<div style={{display:'flex',flexDirection:'column',gap:20}}>
    <div className="ad-grid" style={{gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr)'}}>
      <section className="pn"><div className="pn-h"><h2>สถานะระบบและความปลอดภัย</h2><span className="grow"/>{s&&<span className={'pill '+(s.checks.every(c=>c.ok||c.optional)?'ok':'bad')}>{s.checks.every(c=>c.ok||c.optional)?'พร้อมใช้งาน':'ต้องตั้งค่าเพิ่ม'}</span>}</div>
        {!s?<div className="empty">กำลังโหลด…</div>:<div className="ad-checks">{s.checks.map(c=><div key={c.id} className={'ad-check '+(c.ok?'ok':c.optional?'opt':'no')}><i>{c.ok?'✓':c.optional?'!':'✕'}</i><div><b>{c.label}</b>{!c.ok&&<small>{c.fix}</small>}</div></div>)}</div>}</section>
      <section className="pn"><div className="pn-h"><h2>โค้ดโหลด Hub (กัน Cloudflare บล็อก)</h2></div>
        <div style={{color:'var(--dim)',fontSize:13,lineHeight:1.65}}>{hosts.length>1?'โค้ดนี้ลองโดเมนตามลำดับ ถ้าโดเมนแรกโดน Cloudflare บล็อก (ได้หน้า HTML/ว่าง) จะข้ามไปโดเมนถัดไปเอง':'ยังไม่มีโดเมนสำรอง — ตั้ง API_FALLBACK_HOSTS เพื่อเปิดระบบ failover (ดู docs/CLOUDFLARE.md)'}</div>
        {snippet&&<pre className="snip">{snippet}</pre>}
        <div className="row" style={{marginTop:12}}><button className="btn" disabled={!snippet} onClick={()=>copy(snippet,'ls')}>{cp==='ls'?'คัดลอกแล้ว ✓':'คัดลอกโค้ด'}</button></div>
        {hosts.length>0&&<div style={{marginTop:14,display:'flex',flexWrap:'wrap',gap:6}}>{hosts.map((h,i)=><span key={h} className={'pill '+(i?'':'blue')}>{i?'สำรอง':'หลัก'} · {h}</span>)}</div>}</section>
    </div>
    <GameManager/>
  </div>);
}
