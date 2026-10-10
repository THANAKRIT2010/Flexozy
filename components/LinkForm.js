'use client';
import { useState } from 'react';
import Turnstile from './Turnstile';
import { ls } from '@/lib/snippets';
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', bad_slug:'โค้ดลิงก์ใช้ได้เฉพาะ A-Z a-z 0-9 _ - ยาว 4–40 ตัว และห้ามซ้ำคำสงวน', slug_taken:'โค้ดลิงก์นี้ถูกใช้แล้ว',
  turnstile_required:'กรุณารอการตรวจสอบความปลอดภัยให้เสร็จก่อน', turnstile_failed:'การตรวจสอบความปลอดภัยไม่ผ่าน ลองใหม่อีกครั้ง', pow_required:'การตรวจสอบความปลอดภัยยังไม่เสร็จ',
  empty_script:'กรุณาวางโค้ด', too_large:'โค้ดยาวเกิน 200,000 ตัวอักษร', rate_limited:'สร้างลิงก์ถี่เกินไป รอสักครู่แล้วลองใหม่' };
export { ls };
export const copyText = (t) => navigator.clipboard.writeText(t);
export default function LinkForm({ endpoint, admin, onCreated, hosts = [] }){
  const [f,setF]=useState({title:'',script:'',password:'',slug:'',needs_key:false}), [human,setHuman]=useState(null), [k,setK]=useState(0);
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState('');
  const set=n=>e=>setF(p=>({...p,[n]:e.target.value}));
  const copy=(t,id)=>{copyText(t);setCp(id);setTimeout(()=>setCp(''),1200)};
  async function submit(e){
    e.preventDefault(); if(!human) return; setBusy(true); setErr('');
    let r, d; try{ r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,...human})}); d=await r.json().catch(()=>({})); }catch{ r={ok:false}; d={}; }
    setBusy(false); setHuman(null); setK(x=>x+1); // โจทย์/โทเคนใช้ได้ครั้งเดียว → ขอใหม่ทุกครั้ง
    if(!r.ok) return setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ');
    setRes(d); setF({title:'',script:'',password:'',slug:'',needs_key:false}); onCreated?.();
  }
  const Out=({l,v,id})=><><label>{l}</label><div className="row"><input readOnly value={v}/><button type="button" className="btn ghost" onClick={()=>copy(v,id)}>{cp===id?'คัดลอกแล้ว ✓':'คัดลอก'}</button></div></>;
  return (<>
    <form className="card lf" onSubmit={submit}>
      <div className="f-h">ข้อมูลลิงก์</div>
      <label>ชื่อลิงก์ (ไม่บังคับ)</label><input value={f.title} onChange={set('title')} placeholder="เช่น สคริปต์บินใน Blox Fruits" maxLength={120}/>
      {admin && <><label>กำหนดโค้ดลิงก์เอง — เว้นว่างเพื่อสุ่มให้</label><input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub" maxLength={40}/></>}
      <div className="f-h">โค้ดของคุณ <em>{f.script.length.toLocaleString()} / 200,000</em></div>
      <textarea required value={f.script} onChange={set('script')} placeholder="-- วางโค้ด Lua ที่นี่" spellCheck={false} maxLength={200000}/>
      <div className="f-h">ความปลอดภัย</div>
      <label>รหัสผ่านหน้าดูโค้ด (ไม่บังคับ)</label><input value={f.password} onChange={set('password')} placeholder="เว้นว่าง = ใครก็เปิดหน้าดูได้" maxLength={128}/>
      {admin && <label className="chk"><input type="checkbox" checked={f.needs_key} onChange={e=>setF(p=>({...p,needs_key:e.target.checked}))}/>ต้องใช้ key (ผูก HWID) ถึงจะโหลดได้</label>}
      <Turnstile key={k} onChange={setHuman}/>
      <button className="btn w" disabled={busy||!human}>{busy?'กำลังสร้าง...':human?'สร้างลิงก์':'กำลังตรวจสอบความปลอดภัย...'}</button>
      {err&&<div className="err">{err}</div>}
    </form>
    {res&&<div className="res"><div className="f-h" style={{marginTop:0}}>✓ สร้างลิงก์สำเร็จ</div>
      <Out l="ลิงก์หน้าดู" v={`${location.origin}/vault/${res.code}`} id="a"/>
      <Out l="โค้ดพร้อมใช้ (วางใน executor)" v={ls(res.raw_url)} id="b"/>
      <Out l="Raw URL" v={res.raw_url} id="c"/></div>}</>);
}
