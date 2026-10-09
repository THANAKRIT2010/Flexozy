'use client';
import { useState } from 'react';
import Turnstile from './Turnstile';
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', bad_slug:'โค้ดลิงก์ใช้ได้เฉพาะ A-Z a-z 0-9 _ - ยาว 4–40 ตัว', slug_taken:'โค้ดลิงก์นี้ถูกใช้แล้ว',
  turnstile_required:'กรุณารอการตรวจสอบความปลอดภัยให้เสร็จก่อน', turnstile_failed:'การตรวจสอบความปลอดภัยไม่ผ่าน ลองใหม่อีกครั้ง',
  turnstile_not_configured:'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า TURNSTILE_SECRET_KEY', empty_script:'กรุณาวางโค้ด' };
export const ls = (u) => `loadstring(game:HttpGet("${u}"))()`;
export const copyText = (t) => navigator.clipboard.writeText(t);
export default function LinkForm({ endpoint, admin, onCreated }){
  const [f,setF]=useState({title:'',script:'',password:'',slug:'',needs_key:false}), [tok,setTok]=useState(''), [k,setK]=useState(0);
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState('');
  const set=n=>e=>setF({...f,[n]:e.target.value});
  const copy=(t,id)=>{copyText(t);setCp(id);setTimeout(()=>setCp(''),1200)};
  async function submit(e){
    e.preventDefault(); setBusy(true); setErr('');
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,turnstile:tok})});
    const d=await r.json().catch(()=>({})); setBusy(false); setTok(''); setK(x=>x+1);
    if(!r.ok) return setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ');
    setRes(d); setF({title:'',script:'',password:'',slug:'',needs_key:false}); onCreated?.();
  }
  const Out=({l,v,id})=><><label>{l}</label><div className="row"><input readOnly value={v}/><button type="button" className="btn ghost" onClick={()=>copy(v,id)}>{cp===id?'Copied ✓':'Copy'}</button></div></>;
  return (<>
    <form className="card" onSubmit={submit}>
      <div className="f-h"><span className="f-n">01</span>ข้อมูลลิงก์</div>
      <label>ชื่อลิงก์ (ไม่บังคับ)</label><input value={f.title} onChange={set('title')} placeholder="เช่น Script บิน Blox Fruits"/>
      {admin && <><label>กำหนดโค้ดลิงก์เอง — เว้นว่าง = สุ่มให้</label><input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub" maxLength={40}/></>}
      <div className="f-h"><span className="f-n">02</span>โค้ดของคุณ <em>{f.script.length.toLocaleString()} / 200,000</em></div>
      <textarea required value={f.script} onChange={set('script')} placeholder="-- วางโค้ด Lua ที่นี่" spellCheck={false}/>
      <div className="f-h"><span className="f-n">03</span>ความปลอดภัย</div>
      <label>รหัสผ่านหน้าดูโค้ด (ไม่บังคับ)</label><input value={f.password} onChange={set('password')} placeholder="เว้นว่าง = ใครก็เปิดหน้าดูได้"/>
      {admin && <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" style={{width:'auto'}} checked={f.needs_key} onChange={e=>setF({...f,needs_key:e.target.checked})}/>ต้องใช้ key (ผูก HWID) ถึงจะโหลดได้</label>}
      <Turnstile key={k} onToken={setTok}/>
      <button className="btn w" disabled={busy||!tok}>{busy?'กำลังสร้าง...':tok?'แปลงเป็นลิงก์  →':'กำลังตรวจสอบความปลอดภัย...'}</button>
      {err&&<div className="err">{err}</div>}
    </form>
    {res&&<div className="res"><div className="f-h" style={{marginTop:0}}>✓ สร้างลิงก์สำเร็จ</div>
      <Out l="ลิงก์หน้าดู" v={`${location.origin}/vault/${res.code}`} id="a"/>
      <Out l="โค้ดพร้อมใช้ (วางใน executor)" v={ls(res.raw_url)} id="b"/>
      <Out l="Raw URL" v={res.raw_url} id="c"/>
    </div>}</>);
}
