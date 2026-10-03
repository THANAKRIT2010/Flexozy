'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { ls, copyText } from './LinkForm';
import Profile from './Profile';
import PlayerList from './PlayerList';
export default function AdminPanel({ user }){
  const [d,setD]=useState({stats:{links:0,views:0,owners:0},links:[]}),[q,setQ]=useState(''),[cp,setCp]=useState(''),[error,setError]=useState('');
  const load=useCallback(async()=>{const r=await fetch('/api/admin/vault');if(r.ok)setD(await r.json());else setError('โหลดข้อมูลไม่สำเร็จ')},[]);
  useEffect(()=>{load()},[load]);
  async function del(c){if(!confirm(`ลบลิงก์ ${c} ?`))return;const r=await fetch('/api/admin/vault/'+encodeURIComponent(c),{method:'DELETE'});if(r.ok)load();else setError('ลบลิงก์ไม่สำเร็จ')}
  async function copy(t,k){try{await copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)}catch{setError('คัดลอกไม่สำเร็จ')}}
  const rows=d.links.filter(v=>(v.code+v.title+(v.owner_name||'')).toLowerCase().includes(q.toLowerCase()));
  return <><nav className="nav"><a className="nav-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY<span> / ADMIN</span></b></a><div className="nav-actions"><a className="btn ghost" href="/">หน้าผู้ใช้ ↗</a><Profile user={user} count={d.links.filter(v=>v.owner_name===user.username).length}/></div></nav>
    <main className="wrap admin-wrap"><header className="hero admin-hero"><span className="eyebrow"><span className="online-dot"/> CONTROL CENTER / FLEXOZY</span><h1>ภาพรวม<em>ระบบ.</em></h1><p>จัดการสคริปต์และตรวจสอบการใช้งาน</p></header>
      <div className="stats"><div><span>ลิงก์ทั้งหมด</span><b>{d.stats.links}</b><small>VAULT LINKS</small></div><div><span>ยอดรัน / ดู</span><b>{d.stats.views}</b><small>TOTAL REQUESTS</small></div><div><span>ผู้สร้าง</span><b>{d.stats.owners}</b><small>CREATORS</small></div></div>
      <LinkForm endpoint="/api/admin/vault" admin onCreated={load}/>
      <section className="links-section"><div className="section-heading"><div><span className="eyebrow">MANAGE / 02</span><h2>ลิงก์ทั้งหมด <small>{rows.length}</small></h2></div><input aria-label="ค้นหาลิงก์" placeholder="ค้นหาโค้ด / ชื่อ / ผู้สร้าง" value={q} onChange={e=>setQ(e.target.value)}/></div>{error&&<p className="err">{error}</p>}
        {rows.length===0?<div className="empty-panel">ไม่พบรายการ</div>:<div className="link-list">{rows.map(v=><div className="link-item" key={v.code}><div className="link-details"><div className="link-title">{v.title}{v.has_password&&<span title="มีรหัสผ่าน"> ◈</span>}</div><div className="link-meta">/{v.code} <span>·</span> {v.views} ครั้ง <span>·</span> {v.owner_name||'ไม่ระบุ'}</div><PlayerList code={v.code}/></div><div className="link-actions"><button className="btn ghost" onClick={()=>copy(v.raw_url,'raw'+v.code)}>{cp==='raw'+v.code?'คัดลอกแล้ว':'Raw'}</button><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),'ls'+v.code)}>{cp==='ls'+v.code?'คัดลอกแล้ว':'Loadstring'}</button><a className="btn ghost" href={`/vault/${v.code}`}>เปิด ↗</a><button className="btn danger" onClick={()=>del(v.code)}>ลบ</button></div></div>)}</div>}
      </section></main><footer className="footer">FLEXOZY <span>© 2026 · ADMIN CONSOLE</span></footer></>;
}
