'use client';
import { useState } from 'react';
import Turnstile from './Turnstile';
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', bad_slug:'โค้ดลิงก์ใช้ได้เฉพาะ A-Z a-z 0-9 _ - ยาว 4–40 ตัว', slug_taken:'โค้ดลิงก์นี้ถูกใช้แล้ว', turnstile_required:'กรุณารอการตรวจสอบความปลอดภัยให้เสร็จก่อน', turnstile_failed:'การตรวจสอบไม่ผ่าน ลองใหม่อีกครั้ง', turnstile_not_configured:'ยังไม่ได้ตั้งค่า Turnstile บนเซิร์ฟเวอร์', empty_script:'กรุณาวางโค้ด' };
export const ls = u => `loadstring(game:HttpGet("${u}"))()`;
export const copyText = t => navigator.clipboard.writeText(t);
export default function LinkForm({ endpoint, admin, onCreated }){
  const [f,setF]=useState({title:'',script:'',password:'',slug:''}), [tok,setTok]=useState(''), [k,setK]=useState(0);
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState('');
  const set=n=>e=>setF({...f,[n]:e.target.value});
  async function copy(t,id){ try{ await copyText(t); setCp(id); setTimeout(()=>setCp(''),1600) }catch{setErr('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง')} }
  async function submit(e){
    e.preventDefault(); setBusy(true); setErr('');
    try{
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,turnstile:tok})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) {setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ'); return}
      setRes(d); setF({title:'',script:'',password:'',slug:''}); onCreated?.();
    }catch{setErr('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่')}
    finally{setBusy(false);setTok('');setK(x=>x+1)}
  }
  return <>
    <form className="card create-form" onSubmit={submit}>
      <div className="card-head"><div><span className="eyebrow">NEW VAULT / 01</span><h2>สร้างลิงก์ใหม่</h2></div><span className="status-dot">พร้อมสร้าง</span></div>
      <div className="field-grid"><div><label htmlFor="title">ชื่อสคริปต์ <small>ไม่บังคับ</small></label><input id="title" value={f.title} onChange={set('title')} placeholder="เช่น Flexozy Hub" maxLength={120}/></div>
      <div><label htmlFor="password">รหัสผ่านหน้าดู <small>ไม่บังคับ</small></label><input id="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="เว้นว่างหากไม่ต้องการ"/></div></div>
      {admin&&<><label htmlFor="slug">กำหนดโค้ดลิงก์ <small>เว้นว่างเพื่อสุ่ม</small></label><input id="slug" value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub" maxLength={40}/></>}
      <label htmlFor="script">โค้ด Lua <span aria-hidden="true">*</span></label><textarea id="script" required value={f.script} onChange={set('script')} placeholder="-- วางโค้ด Lua ของคุณที่นี่" spellCheck="false"/>
      <div className="verify"><div><b>ยืนยันความปลอดภัย</b><span>ตรวจสอบโดย Cloudflare Turnstile</span></div><Turnstile key={k} onToken={setTok}/></div>
      <button className="btn w" disabled={busy||!tok}>{busy?'กำลังสร้าง...':tok?'สร้างลิงก์  ↗':'รอการยืนยันความปลอดภัย'}</button>
      {err&&<div className="err" role="alert">{err}</div>}
    </form>
    {res&&<div className="res" aria-live="polite"><span className="eyebrow">LINK CREATED</span><h3>ลิงก์ของคุณพร้อมแล้ว</h3>
      <label>หน้าดูสคริปต์</label><div className="row"><input readOnly value={`${location.origin}/vault/${res.code}`}/><button className="btn ghost" onClick={()=>copy(`${location.origin}/vault/${res.code}`,'a')}>{cp==='a'?'คัดลอกแล้ว':'คัดลอก'}</button></div>
      <label>Raw URL</label><div className="row"><input readOnly value={res.raw_url}/><button className="btn ghost" onClick={()=>copy(res.raw_url,'raw')}>{cp==='raw'?'คัดลอกแล้ว':'คัดลอก'}</button></div>
      <label>โค้ดพร้อมใช้ในเกม</label><div className="row"><input readOnly value={ls(res.raw_url)}/><button className="btn ghost" onClick={()=>copy(ls(res.raw_url),'b')}>{cp==='b'?'คัดลอกแล้ว':'คัดลอก'}</button></div>
    </div>}
  </>;
}
