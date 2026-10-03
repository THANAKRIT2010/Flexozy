'use client';
import { useEffect, useState, useCallback } from 'react';
import Turnstile from '@/components/Turnstile';
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', bad_slug:'ชื่อลิงก์ใช้ได้เฉพาะ A-Z a-z 0-9 _ - ความยาว 4–40 ตัว', slug_taken:'ชื่อลิงก์นี้ถูกใช้แล้ว',
  admin_only_slug:'เฉพาะแอดมินที่ตั้งชื่อลิงก์เองได้', turnstile_required:'กรุณารอการตรวจสอบความปลอดภัยให้เสร็จก่อน', turnstile_failed:'การตรวจสอบความปลอดภัยไม่ผ่าน ลองใหม่อีกครั้ง',
  turnstile_not_configured:'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า TURNSTILE_SECRET_KEY', empty_script:'กรุณาวางโค้ด' };
export default function Home(){
  const [me,setMe]=useState(undefined), [f,setF]=useState({title:'',script:'',password:'',slug:''}), [tok,setTok]=useState(''), [tsKey,setTsKey]=useState(0);
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState(''), [list,setList]=useState([]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const load=useCallback(async()=>{ const r=await fetch('/api/vault'); if(r.ok) setList(await r.json()); },[]);
  useEffect(()=>{ fetch('/api/me').then(r=>r.json()).then(d=>{ setMe(d.authenticated?d.user:null); if(d.authenticated) load(); }); },[load]);
  async function submit(e){
    e.preventDefault(); setBusy(true); setErr('');
    const r=await fetch('/api/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,turnstile:tok})});
    const d=await r.json().catch(()=>({})); setBusy(false); setTok(''); setTsKey(k=>k+1);
    if(!r.ok) return setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ');
    setRes(d); setF({title:'',script:'',password:'',slug:''}); load();
  }
  async function del(code){ if(!confirm('ลบลิงก์นี้?')) return; await fetch('/api/vault/'+code,{method:'DELETE'}); load(); }
  const copy=(t,k)=>{navigator.clipboard.writeText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  const ls=u=>`loadstring(game:HttpGet("${u}"))()`;
  return (<>
    <nav className="nav"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY</b><span style={{flex:1}}/>
      {me===null && <a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord</a>}
      {me && <><span className="who">{me.avatar&&<img src={me.avatar} alt=""/>}{me.username}{me.is_admin&&<em>ADMIN</em>}</span><a className="btn ghost" href="/logout">ออก</a></>}
    </nav>
    <main className="wrap">
      <div className="hero"><img src="/images/flexozy-logo.png" alt="Flexozy"/><h1>ฝากสคริปต์เป็นลิงก์ส่วนตัว</h1><p>วางโค้ด แปลงเป็นลิงก์ ตั้งรหัสผ่านได้</p></div>
      {me===null && <div className="card" style={{textAlign:'center'}}><p style={{color:'var(--dim)'}}>เข้าสู่ระบบด้วย Discord เพื่อสร้างลิงก์</p><a className="btn" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></div>}
      {me && <form className="card" onSubmit={submit}>
        <label>ชื่อลิงก์ (ไม่บังคับ)</label><input value={f.title} onChange={set('title')} placeholder="เช่น Script บิน Blox Fruits"/>
        {me.is_admin && <><label>กำหนดโค้ดลิงก์เอง (แอดมิน) — เว้นว่าง = สุ่มให้</label><input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub" maxLength={40}/></>}
        <label>วางโค้ดของคุณ *</label><textarea required value={f.script} onChange={set('script')} placeholder="-- วางโค้ด Lua ที่นี่"/>
        <label>รหัสผ่าน (ไม่บังคับ)</label><input value={f.password} onChange={set('password')} placeholder="เว้นว่าง = ใครก็เปิดได้"/>
        <Turnstile key={tsKey} onToken={setTok}/>
        <button className="btn w" disabled={busy||!tok}>{busy?'กำลังสร้าง...':tok?'แปลงเป็นลิงก์':'กำลังตรวจสอบความปลอดภัย...'}</button>
        {err&&<div className="err">{err}</div>}
      </form>}
      {res&&<div className="res">
        <label style={{marginTop:0}}>ลิงก์หน้าดู</label>
        <div className="row"><input readOnly value={`${location.origin}/vault/${res.code}`}/><button className="btn ghost" onClick={()=>copy(`${location.origin}/vault/${res.code}`,'a')}>{cp==='a'?'Copied':'Copy'}</button></div>
        <label>โค้ดพร้อมใช้ (วางใน executor)</label>
        <div className="row"><input readOnly value={ls(res.raw_url)}/><button className="btn ghost" onClick={()=>copy(ls(res.raw_url),'b')}>{cp==='b'?'Copied':'Copy'}</button></div>
      </div>}
      {me&&list.length>0&&<div className="card" style={{marginTop:22}}><b>{me.is_admin?'ลิงก์ทั้งหมด':'ลิงก์ของฉัน'}</b>
        {list.map(v=><div className="item" key={v.code}><div style={{minWidth:0}}><div className="t">{v.title}{v.has_password&&' 🔒'}</div><div className="s">{v.code} · {v.views} views{me.is_admin&&` · ${v.owner_name||'-'}`}</div></div>
          <div className="row"><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),v.code)}>{cp===v.code?'Copied':'Loadstring'}</button><a className="btn ghost" href={`/vault/${v.code}`}>เปิด</a><button className="btn ghost" onClick={()=>del(v.code)}>ลบ</button></div></div>)}
      </div>}
    </main></>);
}
