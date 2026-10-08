'use client';
import { useEffect, useState, useCallback } from 'react';
import { ago } from '@/components/Ui';
// แผงจัดการคีย์ (เจ้าของลิงก์/แอดมิน): สวิตช์ lic/hide + สร้าง/ยกเลิก/รีเซ็ตเครื่อง/ลบคีย์ + บันทึกการส่งสคริปต์ (ลายน้ำ)
export default function KeysPanel({ code, onSettings }){
  const [d,setD]=useState(null), [busy,setBusy]=useState(false), [err,setErr]=useState(''), [made,setMade]=useState(null), [cp,setCp]=useState(false);
  const [label,setLabel]=useState(''), [max,setMax]=useState(1), [days,setDays]=useState(30);
  const load=useCallback(async()=>{ try{ const r=await fetch(`/api/vault/${code}/keys`,{cache:'no-store'}); setD(r.ok?await r.json():{error:true}); }catch{ setD({error:true}); } },[code]);
  useEffect(()=>{ load(); },[load]);
  async function call(path, method, body){
    setBusy(true); setErr('');
    try{
      const r=await fetch(`/api/vault/${code}/${path}`,{ method, headers:{'Content-Type':'application/json'}, body:body?JSON.stringify(body):undefined });
      const j=r.status===204?{}:await r.json().catch(()=>({}));
      if(!r.ok) setErr('ทำรายการไม่สำเร็จ'); setBusy(false); return r.ok?j:null;
    }catch{ setErr('เชื่อมต่อไม่ได้'); setBusy(false); return null; }
  }
  async function toggle(k,v){ const j=await call('settings','PATCH',{[k]:v}); if(j){ setD(x=>({...x,...j})); onSettings&&onSettings(j); } }
  async function create(){ const j=await call('keys','POST',{label,max,days}); if(j){ setMade(j.key); setLabel(''); load(); } }
  async function patch(id,b){ if(await call('keys','PATCH',{id,...b})) load(); }
  async function del(id){ if(!confirm('ลบคีย์นี้ถาวร?')) return; const r=await call(`keys?id=${id}`,'DELETE'); if(r) load(); }
  if(!d) return <div className="msg">กำลังโหลด...</div>;
  if(d.error) return <div className="msg bad">จัดการคีย์ไม่ได้ (เฉพาะเจ้าของลิงก์)</div>;
  const row={display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',margin:'6px 0'};
  return (<div className="pl">
    <div style={row}><label><input type="checkbox" checked={d.lic} disabled={busy} onChange={e=>toggle('lic',e.target.checked)}/> ต้องมีคีย์ (License) — ผูกเครื่อง + ใส่ลายน้ำ</label></div>
    <div style={row}><label><input type="checkbox" checked={d.hide} disabled={busy} onChange={e=>toggle('hide',e.target.checked)}/> ซ่อนซอสบนหน้าเว็บ (คนอื่นเห็นแค่ loadstring)</label></div>
    {d.lic && <div className="pl-note">วิธีใช้ของผู้ใช้: <code>script_key="คีย์"</code> แล้วต่อด้วย loadstring ตามปกติ</div>}
    <div className="pl-top"><span><b>สร้างคีย์ใหม่</b></span></div>
    <div style={row}>
      <input value={label} placeholder="ชื่อ/ผู้ใช้ (ไม่บังคับ)" onChange={e=>setLabel(e.target.value)}/>
      <input type="number" min="1" max="10" value={max} title="จำนวนเครื่อง" style={{width:70}} onChange={e=>setMax(e.target.value)}/> เครื่อง
      <input type="number" min="0" value={days} title="วัน (0 = ไม่หมดอายุ)" style={{width:80}} onChange={e=>setDays(e.target.value)}/> วัน (0 = ไม่หมดอายุ)
      <button className="btn" disabled={busy} onClick={create}>สร้างคีย์</button>
    </div>
    {made && <div className="msg">คีย์ใหม่ (แสดงครั้งเดียว คัดลอกเก็บไว้เลย): <b>{made}</b>
      <button className="btn ghost" onClick={()=>{navigator.clipboard.writeText(made);setCp(true);setTimeout(()=>setCp(false),1200)}}>{cp?'Copied':'Copy'}</button></div>}
    {err && <div className="msg bad">{err}</div>}
    <div className="pl-top"><span><b>{d.keys.length}</b> คีย์</span><button className="pl-rf" onClick={load} disabled={busy}>รีเฟรช</button></div>
    {d.keys.length===0 && <div className="msg">ยังไม่มีคีย์</div>}
    {d.keys.map(k=><div className="pl-row" key={k.id} style={{flexWrap:'wrap'}}>
      <div className="pl-n"><b>{k.label||k.prefix+'…'}</b><small>{k.prefix}… · {k.devices}/{k.max} เครื่อง · ใช้ {k.uses} ครั้ง · {k.revoked?'ถูกยกเลิก':k.exp?(k.exp<Date.now()?'หมดอายุแล้ว':'หมดอายุ '+new Date(k.exp).toLocaleDateString()):'ไม่หมดอายุ'}{k.last?` · ล่าสุด ${ago(k.last)}`:''}</small></div>
      <button className="btn ghost" disabled={busy} onClick={()=>patch(k.id,{revoked:!k.revoked})}>{k.revoked?'เปิดใช้':'ยกเลิก'}</button>
      <button className="btn ghost" disabled={busy} onClick={()=>patch(k.id,{resetDevices:true})}>รีเซ็ตเครื่อง</button>
      <button className="btn ghost" disabled={busy} onClick={()=>del(k.id)}>ลบ</button></div>)}
    <div className="pl-top"><span><b>บันทึกการส่งสคริปต์</b><i> · 50 ครั้งล่าสุด</i></span></div>
    {d.log.length===0 && <div className="msg">ยังไม่มีการส่ง</div>}
    {d.log.map(x=><div className="pl-row" key={x.n}><div className="pl-n"><b>{x.key}</b><small>wm:{x.n}{x.u?` · Roblox ID ${x.u}`:''}</small></div><span className="pl-t">{ago(x.t)}</span></div>)}
    <div className="pl-note">ถ้าซอสหลุด ค้นรหัส <code>wm:…</code> ในโค้ดที่หลุด แล้วเทียบกับบันทึกด้านบนเพื่อรู้ว่าหลุดจากคีย์ไหน แล้วกด “ยกเลิก”</div>
  </div>);
}
