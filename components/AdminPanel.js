'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { ls, copyText } from './LinkForm';
export default function AdminPanel({ user }){
  const [d,setD]=useState({stats:{links:0,views:0,owners:0},links:[]}), [q,setQ]=useState(''), [cp,setCp]=useState('');
  const load=useCallback(async()=>{ const r=await fetch('/api/admin/vault'); if(r.ok) setD(await r.json()); },[]);
  useEffect(()=>{ load() },[load]);
  async function del(c){ if(!confirm(`ลบลิงก์ ${c} ?`)) return; await fetch('/api/admin/vault/'+c,{method:'DELETE'}); load(); }
  const copy=(t,k)=>{copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  const rows=d.links.filter(v=>(v.code+v.title+(v.owner_name||'')).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <nav className="nav"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY ADMIN</b><span style={{flex:1}}/>
      <a className="btn ghost" href="/">หน้าผู้ใช้</a><span className="who">{user.avatar&&<img src={user.avatar} alt=""/>}{user.username}<em>ADMIN</em></span><a className="btn ghost" href="/logout">ออก</a></nav>
    <main className="wrap">
      <div className="stats"><div className="card"><b>{d.stats.links}</b><span>ลิงก์ทั้งหมด</span></div><div className="card"><b>{d.stats.views}</b><span>ยอดรัน/ดู</span></div><div className="card"><b>{d.stats.owners}</b><span>ผู้สร้าง</span></div></div>
      <h2 className="h2">สร้างลิงก์ (กำหนดโค้ดเองได้)</h2>
      <LinkForm endpoint="/api/admin/vault" admin onCreated={load}/>
      <h2 className="h2">ลิงก์ทั้งหมด</h2>
      <input placeholder="ค้นหาโค้ด / ชื่อ / ผู้สร้าง" value={q} onChange={e=>setQ(e.target.value)}/>
      <div className="card" style={{marginTop:12}}>
        {rows.length===0&&<div className="s" style={{color:'var(--dim)'}}>ไม่มีรายการ</div>}
        {rows.map((v,i)=><div className="item" style={i===0?{borderTop:0,marginTop:0,paddingTop:0}:{}} key={v.code}><div style={{minWidth:0}}><div className="t">{v.title}{v.has_password&&' 🔒'}</div><div className="s">{v.code} · {v.views} views · {v.owner_name||'-'}</div></div>
          <div className="row"><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),v.code)}>{cp===v.code?'Copied':'Loadstring'}</button><a className="btn ghost" href={`/vault/${v.code}`}>เปิด</a><button className="btn ghost" onClick={()=>del(v.code)}>ลบ</button></div></div>)}
      </div>
    </main></>);
}
