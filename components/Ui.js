'use client';
import { useEffect, useState, useCallback } from 'react';
export const ago = (t) => { const s = Math.max(0, (Date.now()-t)/1000|0);
  return s<60 ? `${s} วิที่แล้ว` : s<3600 ? `${s/60|0} นาทีที่แล้ว` : s<86400 ? `${s/3600|0} ชม.ที่แล้ว` : `${s/86400|0} วันที่แล้ว`; };
export function Avatar({ src, name, size=40 }){
  return src ? <img className="av" src={src} alt="" style={{width:size,height:size}}/>
    : <span className="av" style={{width:size,height:size,fontSize:size*.45}}>{(name||'?')[0].toUpperCase()}</span>;
}
export function Modal({ onClose, children }){
  useEffect(()=>{ const k=e=>e.key==='Escape'&&onClose(); addEventListener('keydown',k); return ()=>removeEventListener('keydown',k); },[onClose]);
  return <div className="mdl" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="mdl-box"><button className="mdl-x" onClick={onClose} aria-label="ปิด">✕</button>{children}</div></div>;
}
// รายชื่อผู้เล่น — โหลดเมื่อถูกเปิด (ต้องกดดูเอง) ใช้ทั้งในหน้าหลัก/หลังบ้าน/หน้า vault
export function PlayersList({ code }){
  const [d,setD]=useState(null), [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{ setBusy(true);
    try{ const r=await fetch(`/api/vault/${code}/players`,{cache:'no-store'}); setD(r.ok?await r.json():{error:true}); }catch{ setD({error:true}); }
    setBusy(false); },[code]);
  useEffect(()=>{ load(); },[load]);
  if(!d) return <div className="msg">กำลังโหลด...</div>;
  if(d.error) return <div className="msg bad">ดูรายชื่อไม่ได้ (เฉพาะเจ้าของลิงก์)</div>;
  return (<div className="pl">
    <div className="pl-top"><span><b>{d.online}</b> ออนไลน์ในเกม<i> · เคยรันทั้งหมด {d.total} คน</i></span>
      <button className="pl-rf" onClick={load} disabled={busy}>{busy?'...':'รีเฟรช'}</button></div>
    {d.players.length===0 && <div className="msg">ยังไม่มีคนรัน — รายชื่อจะขึ้นหลังมีคนรัน loadstring ในเกม</div>}
    {d.players.map(p=><div className="pl-row" key={p.id}>
      <span className={'pl-dot'+(p.online?' on':'')}/>
      <div className="pl-n"><a href={`https://www.roblox.com/users/${p.id}/profile`} target="_blank" rel="noreferrer">{p.display||p.name}</a><small>@{p.name} · {p.game||'—'}</small></div>
      <span className="pl-t">{p.online?'กำลังเล่น':ago(p.last_seen)}</span></div>)}
    <div className="pl-note">นับว่าออนไลน์ถ้ามีสัญญาณภายใน 2 นาที · อัปเดตทุก 45 วิ</div>
  </div>);
}
export function ProfileModal({ p, links, onClose, onPlayers }){
  const views = links.reduce((s,v)=>s+(v.views||0),0);
  return (<Modal onClose={onClose}>
    <div className="pf-head"><Avatar src={p.avatar} name={p.name} size={72}/><div><h3>{p.name}</h3>{p.tag&&<span className="tag">{p.tag}</span>}<div className="pf-id">Discord ID · {p.id||'—'}</div></div></div>
    <div className="pf-stats"><div><b>{links.length}</b><span>ลิงก์</span></div><div><b>{views.toLocaleString()}</b><span>ยอดรัน/ดู</span></div><div><b>{links.filter(v=>v.has_password).length}</b><span>ล็อกรหัส</span></div></div>
    <div className="pf-sub">ลิงก์ล่าสุด</div>
    {links.length===0 && <div className="msg">ยังไม่มีลิงก์</div>}
    {links.slice(0,6).map(v=><div className="pf-row" key={v.code}><div><div className="t">{v.title}{v.has_password&&' 🔒'}</div><div className="s">{v.code} · {v.views} views</div></div>
      {onPlayers&&<button className="btn ghost" onClick={()=>onPlayers(v.code)}>ผู้เล่น</button>}</div>)}
    {p.logout&&<a className="btn ghost w" href="/logout">ออกจากระบบ</a>}
  </Modal>);
}
