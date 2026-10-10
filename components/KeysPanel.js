'use client';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { copyText } from './LinkForm';
import { ago } from './Ui';
const state = (k) => k.revoked ? ['bad','เพิกถอนแล้ว'] : (k.exp && Date.now() > k.exp) ? ['warn','หมดอายุ'] : ['ok','ใช้งานได้'];
export default function KeysPanel(){
  const [keys,setKeys]=useState([]), [f,setF]=useState({label:'',days:30,count:1,scope:'hub'}), [fresh,setFresh]=useState([]), [open,setOpen]=useState(null), [busy,setBusy]=useState(false), [q,setQ]=useState(''), [err,setErr]=useState('');
  const load=useCallback(async()=>{ const r=await fetch('/api/admin/keys'); if(r.ok) setKeys(await r.json()); },[]);
  useEffect(()=>{ load() },[load]);
  async function create(e){ e.preventDefault(); setBusy(true); setErr('');
    const r=await fetch('/api/admin/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:f.label,days:Number(f.days),count:Number(f.count),scopes:f.scope.split(',').map(s=>s.trim()).filter(Boolean)})});
    setBusy(false); if(r.ok){ setFresh((await r.json()).keys); load(); } else setErr('สร้าง key ไม่สำเร็จ'); }
  const act=async(kid,action)=>{ await fetch('/api/admin/keys/'+kid,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})}); load(); };
  const del=async(kid)=>{ if(!confirm('ลบ key นี้ถาวร?')) return; await fetch('/api/admin/keys/'+kid,{method:'DELETE'}); load(); };
  const rows=keys.filter(k=>(k.label+k.hint+k.scopes.join(',')).toLowerCase().includes(q.toLowerCase()));
  return (<div className="ad-grid ad-g2">
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <form className="pn" onSubmit={create}>
        <div className="pn-h"><h2>สร้าง key ใหม่</h2></div>
        <label>ชื่อ/หมายเหตุ (เช่น ชื่อ Discord ของผู้ใช้)</label><input value={f.label} onChange={e=>setF({...f,label:e.target.value})} maxLength={60}/>
        <div className="row" style={{alignItems:'flex-start'}}><div style={{flex:1}}><label>อายุ (วัน, 0 = ไม่หมดอายุ)</label><input type="number" min="0" max="3650" value={f.days} onChange={e=>setF({...f,days:e.target.value})}/></div>
          <div style={{flex:1}}><label>จำนวน key</label><input type="number" min="1" max="50" value={f.count} onChange={e=>setF({...f,count:e.target.value})}/></div></div>
        <label>สิทธิ์ — hub = เข้า Hub + ทุกแมพ · * = ทั้งหมด · login = แค่เข้า Hub · v:โค้ดลิงก์ · hub:ไอดีแมพ (คั่นด้วย ,)</label><input value={f.scope} onChange={e=>setF({...f,scope:e.target.value})}/>
        <button className="btn w" disabled={busy}>{busy?'กำลังสร้าง...':'สร้าง key'}</button>{err&&<div className="err">{err}</div>}
      </form>
      {fresh.length>0&&<div className="res"><div className="f-h" style={{marginTop:0}}>✓ คัดลอกเก็บไว้เลย — ระบบแสดงเต็มครั้งเดียว</div>
        {fresh.map(k=><div className="row" key={k} style={{marginBottom:6}}><input readOnly value={k}/><button type="button" className="btn ghost" onClick={()=>copyText(k)}>คัดลอก</button></div>)}
        <div style={{color:'var(--dim)',fontSize:12,marginTop:8}}>ผู้ใช้ใส่ key ในช่อง Enter Key ของ Hub หรือตั้งก่อนรัน: <code>getgenv().Key = "key ของเขา"</code></div>
        <button type="button" className="btn ghost sm" onClick={()=>setFresh([])} style={{marginTop:10}}>ปิด</button></div>}
    </div>
    <section className="pn" style={{minWidth:0}}>
      <div className="pn-h"><h2>Key ทั้งหมด</h2><small>{rows.length} จาก {keys.length}</small><span className="grow"/><input className="search" placeholder="ค้นหาชื่อ / สิทธิ์" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div className="ad-tw"><table>
        <thead><tr><th>ผู้ใช้</th><th>สถานะ</th><th>สิทธิ์</th><th>หมดอายุ</th><th>เครื่อง (HWID)</th><th className="num">ใช้งาน</th><th>ล่าสุด</th><th style={{textAlign:'right'}}>จัดการ</th></tr></thead>
        <tbody>
          {rows.length===0&&<tr><td colSpan={8} className="empty">{keys.length?'ไม่พบ key ที่ค้นหา':'ยังไม่มี key — สร้างได้จากฟอร์มด้านซ้าย'}</td></tr>}
          {rows.map(k=>{ const [c,t]=state(k); return <Fragment key={k.kid}><tr>
            <td><div className="t">{k.label||'(ไม่มีชื่อ)'}</div><div className="s">{k.hint}</div></td>
            <td><span className={'pill '+c}>{t}</span></td>
            <td><span className="s">{k.scopes.join(', ')}</span></td>
            <td>{k.exp?new Date(k.exp).toLocaleDateString('th-TH'):'ไม่หมดอายุ'}</td>
            <td>{k.bound?<span className="pill blue">{k.hw}</span>:<span className="pill">ยังไม่ผูก</span>}{k.denied>0&&<span className="pill bad" style={{marginLeft:6}}>ปฏิเสธ {k.denied}</span>}</td>
            <td className="num">{k.uses}</td><td>{k.last_used>0?ago(k.last_used):'—'}</td>
            <td><div className="acts"><button className="btn ghost sm" onClick={()=>setOpen(open===k.kid?null:k.kid)}>ประวัติ</button>
              <button className="btn ghost sm" onClick={()=>act(k.kid,k.revoked?'restore':'revoke')}>{k.revoked?'คืนสิทธิ์':'เพิกถอน'}</button>
              {k.bound&&<button className="btn ghost sm" onClick={()=>act(k.kid,'reset_hwid')}>รีเซ็ต HWID</button>}
              <button className="btn danger sm" onClick={()=>del(k.kid)}>ลบ</button></div></td></tr>
            {open===k.kid&&<tr><td colSpan={8} style={{background:'#10131a'}}>{k.events.length===0?<span style={{color:'var(--dim)'}}>ไม่มีประวัติ</span>:k.events.map((e,i)=><div key={i} className="s">{new Date(e.ts).toLocaleString('th-TH')} · {e.t}{e.ip&&` · ${e.ip}`}{e.scope&&` · ${e.scope}`}</div>)}</td></tr>}</Fragment>; })}
        </tbody></table></div>
    </section></div>);
}
