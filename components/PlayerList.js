'use client';
import { useState } from 'react';
export default function PlayerList({ code }){
  const [open,setOpen]=useState(false),[data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function load(){setBusy(true);setError('');try{const r=await fetch(`/api/vault/${encodeURIComponent(code)}/players`,{cache:'no-store'});if(!r.ok)throw Error();setData(await r.json())}catch{setError('โหลดรายชื่อไม่สำเร็จ')}finally{setBusy(false)}}
  function toggle(){if(open){setOpen(false);return}setOpen(true);load()}
  return <div className="players"><button type="button" className="btn ghost" onClick={toggle} aria-expanded={open}>{open?'ซ่อนผู้เล่น':'ดูผู้เล่นในเกม'}</button>
    {open&&<div className="players-panel"><div className="players-head"><b>ผู้เล่นที่กำลังรัน <span>{data?.count??'—'}</span></b><button type="button" className="btn ghost" onClick={load} disabled={busy}>{busy?'กำลังโหลด':'รีเฟรช'}</button></div>
      {error&&<p className="err" role="alert">{error}</p>}
      {!error&&data?.players.length===0&&<p className="empty">ยังไม่มีผู้เล่นที่รายงานการรันในช่วง 90 วินาทีล่าสุด</p>}
      {!error&&data?.players.map(p=><div className="player-row" key={p.userId}><span className="online-dot"/><span>{p.name}</span><small>#{p.userId}</small></div>)}
      <p className="players-note">แสดงเฉพาะผู้เล่นที่ executor รองรับการส่งสถานะ · หมดอายุเมื่อหยุดรายงาน</p>
    </div>}
  </div>;
}
