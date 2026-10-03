'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { ls, copyText } from '@/components/LinkForm';
import Profile from '@/components/Profile';
import PlayerList from '@/components/PlayerList';
export default function Home(){
  const [me,setMe]=useState(undefined),[list,setList]=useState([]),[cp,setCp]=useState(''),[error,setError]=useState('');
  const load=useCallback(async()=>{const r=await fetch('/api/vault');if(r.ok)setList(await r.json())},[]);
  useEffect(()=>{fetch('/api/me').then(r=>r.json()).then(d=>{setMe(d.authenticated?d.user:null);if(d.authenticated)load()}).catch(()=>setMe(null))},[load]);
  async function del(code){if(!confirm('ลบลิงก์นี้?'))return;const r=await fetch('/api/vault/'+encodeURIComponent(code),{method:'DELETE'});if(r.ok)load();else setError('ลบลิงก์ไม่สำเร็จ')}
  async function copy(t,k){try{await copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)}catch{setError('คัดลอกไม่สำเร็จ')}}
  return <><nav className="nav"><a className="nav-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY<span> / VAULT</span></b></a><div className="nav-actions">{me===null&&<a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord ↗</a>}{me&&<>{me.is_admin&&<a className="btn ghost" href="/admin">หลังบ้าน ↗</a>}<Profile user={me} count={list.length}/></>}</div></nav>
    <main className="wrap"><header className="hero"><span className="eyebrow"><span className="online-dot"/> SCRIPT STORAGE / FLEXOZY</span><h1>พื้นที่สำหรับ<br/><em>สคริปต์ของคุณ.</em></h1><p>สร้าง จัดการ และแชร์สคริปต์ผ่านลิงก์เดียว</p></header>
      {me===null&&<div className="sign-in"><h2>เริ่มสร้างลิงก์ของคุณ</h2><p>เข้าสู่ระบบด้วย Discord เพื่อจัดเก็บสคริปต์</p><a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord ↗</a></div>}
      {me&&<LinkForm endpoint="/api/vault" onCreated={load}/>}
      {me&&<section className="links-section"><div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION / 02</span><h2>ลิงก์ของฉัน <small>{list.length}</small></h2></div></div>{error&&<p className="err">{error}</p>}
        {list.length===0?<div className="empty-panel">ยังไม่มีลิงก์ที่สร้าง</div>:<div className="link-list">{list.map(v=><div className="link-item" key={v.code}><div className="link-details"><div className="link-title">{v.title}{v.has_password&&<span title="มีรหัสผ่าน"> ◈</span>}</div><div className="link-meta">/{v.code} <span>·</span> {v.views} ครั้ง</div><PlayerList code={v.code}/></div><div className="link-actions"><button className="btn ghost" onClick={()=>copy(v.raw_url,'raw'+v.code)}>{cp==='raw'+v.code?'คัดลอกแล้ว':'Raw'}</button><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),'ls'+v.code)}>{cp==='ls'+v.code?'คัดลอกแล้ว':'Loadstring'}</button><a className="btn ghost" href={`/vault/${v.code}`}>เปิด ↗</a><button className="btn danger" onClick={()=>del(v.code)}>ลบ</button></div></div>)}</div>}
      </section>}
    </main><footer className="footer">FLEXOZY <span>© 2026 · SCRIPT VAULT</span></footer></>;
}
