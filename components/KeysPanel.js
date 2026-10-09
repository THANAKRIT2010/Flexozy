'use client';
import { useEffect, useState, useCallback } from 'react';
import { copyText } from './LinkForm';
import { ago } from './Ui';
export default function KeysPanel(){
  const [keys,setKeys]=useState([]), [f,setF]=useState({label:'',days:30,count:1,scope:'*'}), [fresh,setFresh]=useState([]), [open,setOpen]=useState(null), [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{ const r=await fetch('/api/admin/keys'); if(r.ok) setKeys(await r.json()); },[]);
  useEffect(()=>{ load() },[load]);
  async function create(e){ e.preventDefault(); setBusy(true);
    const r=await fetch('/api/admin/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:f.label,days:Number(f.days),count:Number(f.count),scopes:f.scope.split(',').map(s=>s.trim()).filter(Boolean)})});
    setBusy(false); if(r.ok){ setFresh((await r.json()).keys); load(); } }
  const act=async(kid,action)=>{ await fetch('/api/admin/keys/'+kid,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})}); load(); };
  const del=async(kid)=>{ if(!confirm('ลบ key นี้ถาวร?')) return; await fetch('/api/admin/keys/'+kid,{method:'DELETE'}); load(); };
  const st=k=>k.revoked?'🚫 เพิกถอน':(k.exp&&Date.now()>k.exp)?'⌛ หมดอายุ':'✅ ใช้ได้';
  return (<>
    <h2 className="h2">Key ผู้ใช้ (ผูก HWID)</h2>
    <form className="card" onSubmit={create}>
      <label>ชื่อ/หมายเหตุ (เช่น ชื่อผู้ใช้ Discord)</label><input value={f.label} onChange={e=>setF({...f,label:e.target.value})} maxLength={60}/>
      <div className="row"><div style={{flex:1}}><label>อายุ (วัน, 0 = ไม่หมดอายุ)</label><input type="number" min="0" value={f.days} onChange={e=>setF({...f,days:e.target.value})}/></div>
        <div style={{flex:1}}><label>จำนวน key</label><input type="number" min="1" max="50" value={f.count} onChange={e=>setF({...f,count:e.target.value})}/></div></div>
      <label>สิทธิ์: * = ทั้งหมด | hub = เกมใน hub | v:โค้ดลิงก์ (คั่นด้วย ,)</label><input value={f.scope} onChange={e=>setF({...f,scope:e.target.value})}/>
      <button className="btn w" disabled={busy} style={{marginTop:12}}>{busy?'กำลังสร้าง...':'สร้าง key'}</button>
    </form>
    {fresh.length>0&&<div className="res" style={{marginTop:12}}><div className="f-h" style={{marginTop:0}}>✓ คัดลอกเก็บไว้เลย — ระบบแสดงเต็มครั้งเดียว</div>
      {fresh.map(k=><div className="row" key={k} style={{marginBottom:6}}><input readOnly value={k}/><button type="button" className="btn ghost" onClick={()=>copyText(k)}>Copy</button></div>)}
      <div className="s" style={{color:'var(--dim)'}}>ผู้ใช้ตั้งก่อนรัน: getgenv().Key = "key ของเขา"</div>
      <button className="btn ghost" onClick={()=>setFresh([])} style={{marginTop:8}}>ปิด</button></div>}
    <div className="card" style={{marginTop:12}}>
      {keys.length===0&&<div className="s" style={{color:'var(--dim)'}}>ยังไม่มี key</div>}
      {keys.map(k=><div className="item" key={k.kid}><div style={{minWidth:0}}><div className="t">{k.label||'(ไม่มีชื่อ)'} · {st(k)}</div>
        <div className="s">{k.hint} · {k.scopes.join(',')} · {k.exp?'หมด '+new Date(k.exp).toLocaleDateString():'ไม่หมดอายุ'} · {k.bound?`HWID ${k.hw}`:'ยังไม่ผูกเครื่อง'} · ใช้ {k.uses} ครั้ง{k.denied>0&&` · ⚠️ โดนปฏิเสธ ${k.denied}`}{k.last_used>0&&` · ล่าสุด ${ago(k.last_used)}`}</div>
        {open===k.kid&&<div className="s" style={{marginTop:6}}>{k.events.length===0?'ไม่มีประวัติ':k.events.map((e,i)=><div key={i}>{new Date(e.ts).toLocaleString()} · {e.t}{e.ip&&` · ${e.ip}`}{e.scope&&` · ${e.scope}`}</div>)}</div>}</div>
        <div className="row"><button className="btn ghost" onClick={()=>setOpen(open===k.kid?null:k.kid)}>ประวัติ</button>
          <button className="btn ghost" onClick={()=>act(k.kid,k.revoked?'restore':'revoke')}>{k.revoked?'คืนสิทธิ์':'เพิกถอน'}</button>
          {k.bound&&<button className="btn ghost" onClick={()=>act(k.kid,'reset_hwid')}>รีเซ็ต HWID</button>}
          <button className="btn ghost" onClick={()=>del(k.kid)}>ลบ</button></div></div>)}
    </div></>);
}
