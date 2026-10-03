'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { ls, copyText } from '@/components/LinkForm';
export default function Home(){
  const [me,setMe]=useState(undefined), [list,setList]=useState([]), [cp,setCp]=useState('');
  const load=useCallback(async()=>{ const r=await fetch('/api/vault'); if(r.ok) setList(await r.json()); },[]);
  useEffect(()=>{ fetch('/api/me').then(r=>r.json()).then(d=>{ setMe(d.authenticated?d.user:null); if(d.authenticated) load(); }); },[load]);
  async function del(code){ if(!confirm('ลบลิงก์นี้?')) return; await fetch('/api/vault/'+code,{method:'DELETE'}); load(); }
  const copy=(t,k)=>{copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  return (<>
    <nav className="nav"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY</b><span style={{flex:1}}/>
      {me===null && <a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord</a>}
      {me && <>{me.is_admin&&<a className="btn ghost" href="/admin">หลังบ้านแอดมิน</a>}<span className="who">{me.avatar&&<img src={me.avatar} alt=""/>}{me.username}</span><a className="btn ghost" href="/logout">ออก</a></>}
    </nav>
    <main className="wrap">
      <div className="hero"><img src="/images/flexozy-logo.png" alt="Flexozy"/><h1>ฝากสคริปต์เป็นลิงก์ส่วนตัว</h1><p>วางโค้ด แปลงเป็นลิงก์ ตั้งรหัสผ่านได้</p></div>
      {me===null && <div className="card" style={{textAlign:'center'}}><p style={{color:'var(--dim)'}}>เข้าสู่ระบบด้วย Discord เพื่อสร้างลิงก์</p><a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></div>}
      {me && <LinkForm endpoint="/api/vault" onCreated={load}/>}
      {me&&list.length>0&&<div className="card" style={{marginTop:22}}><b>ลิงก์ของฉัน</b>
        {list.map(v=><div className="item" key={v.code}><div style={{minWidth:0}}><div className="t">{v.title}{v.has_password&&' 🔒'}</div><div className="s">{v.code} · {v.views} views</div></div>
          <div className="row"><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),v.code)}>{cp===v.code?'Copied':'Loadstring'}</button><a className="btn ghost" href={`/vault/${v.code}`}>เปิด</a><button className="btn ghost" onClick={()=>del(v.code)}>ลบ</button></div></div>)}
      </div>}
    </main></>);
}
