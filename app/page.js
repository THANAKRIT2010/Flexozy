'use client';
import { useState } from 'react';
export default function Home(){
  const [f,setF]=useState({title:'',script:'',password:'',key:''}), [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState('');
  const set=k=>e=>setF({...f,[k]:e.target.value});
  async function submit(e){
    e.preventDefault(); setBusy(true); setErr('');
    const r=await fetch('/api/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});
    const d=await r.json().catch(()=>({})); setBusy(false);
    if(!r.ok) return setErr(d.error==='bad_key'?'คีย์สร้างลิงก์ไม่ถูกต้อง':'สร้างลิงก์ไม่สำเร็จ');
    setRes(d);
  }
  const copy=(t,k)=>{navigator.clipboard.writeText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  const ls=res&&`loadstring(game:HttpGet("${res.raw_url}${f.password?'?password='+encodeURIComponent(f.password):''}"))()`;
  return (<>
    <nav className="nav"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY</b></nav>
    <main className="wrap">
      <div className="hero"><img src="/images/flexozy-logo.png" alt="Flexozy"/><h1>ฝากสคริปต์เป็นลิงก์ส่วนตัว</h1><p>วางโค้ด แปลงเป็นลิงก์ ตั้งรหัสผ่านได้</p></div>
      <form className="card" onSubmit={submit}>
        <label>ชื่อลิงก์ (ไม่บังคับ)</label><input value={f.title} onChange={set('title')} placeholder="เช่น Script บิน Blox Fruits"/>
        <label>วางโค้ดของคุณ *</label><textarea required value={f.script} onChange={set('script')} placeholder="-- วางโค้ด Lua ที่นี่"/>
        <label>รหัสผ่าน (ไม่บังคับ)</label><input value={f.password} onChange={set('password')} placeholder="เว้นว่าง = ใครก็เปิดได้"/>
        <label>คีย์สร้างลิงก์ (ถ้าเว็บตั้งไว้)</label><input type="password" value={f.key} onChange={set('key')}/>
        <button className="btn w" disabled={busy}>{busy?'กำลังสร้าง...':'แปลงเป็นลิงก์'}</button>
        {err&&<div className="err">{err}</div>}
      </form>
      {res&&<div className="res">
        <label style={{marginTop:0}}>ลิงก์หน้าดู</label>
        <div className="row"><input readOnly value={`${location.origin}/vault/${res.code}`}/><button className="btn ghost" onClick={()=>copy(`${location.origin}/vault/${res.code}`,'a')}>{cp==='a'?'Copied':'Copy'}</button></div>
        <label>โค้ดพร้อมใช้ (วางใน executor)</label>
        <div className="row"><input readOnly value={ls}/><button className="btn ghost" onClick={()=>copy(ls,'b')}>{cp==='b'?'Copied':'Copy'}</button></div>
      </div>}
    </main></>);
}
