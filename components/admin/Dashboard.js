'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { copyText } from '../LinkForm';
import { ls, failover } from '@/lib/snippets';
import { Avatar, Modal, ProfileModal, PlayersList } from '../Ui';
export default function Dashboard(){
  const [d,setD]=useState({stats:{links:0,views:0,owners:0},links:[],hosts:[]}), [keys,setKeys]=useState(0), [maps,setMaps]=useState(0), [q,setQ]=useState(''), [cp,setCp]=useState(''), [prof,setProf]=useState(null), [pl,setPl]=useState(null), [ready,setReady]=useState(false);
  const load=useCallback(async()=>{ const r=await fetch('/api/admin/vault'); if(r.ok) setD(await r.json()); setReady(true); },[]);
  useEffect(()=>{ load();
    fetch('/api/admin/keys').then(r=>r.ok?r.json():[]).then(k=>setKeys(k.length)).catch(()=>{});
    fetch('/api/admin/games').then(r=>r.ok?r.json():{games:[]}).then(g=>setMaps((g.games||[]).length)).catch(()=>{}); },[load]);
  async function del(c){ if(!confirm(`ลบลิงก์ ${c} ?`)) return; await fetch('/api/admin/vault/'+c,{method:'DELETE'}); load(); }
  async function toggleKey(v){ await fetch('/api/admin/vault/'+v.code,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({needs_key:!v.needs_key})}); load(); }
  const copy=(t,k)=>{copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  const rows=d.links.filter(v=>(v.code+v.title+(v.owner_name||'')).toLowerCase().includes(q.toLowerCase()));
  const openProf=v=>setProf({ id:v.owner_id, name:v.owner_name||'-', avatar:v.owner_avatar });
  return (<>
    <section className="ad-stats">
      <div className="ad-stat hot"><span>ยอดรัน/ดูทั้งหมด</span><b>{d.stats.views.toLocaleString()}</b></div>
      <div className="ad-stat"><span>ลิงก์ทั้งหมด</span><b>{d.stats.links}</b></div>
      <div className="ad-stat"><span>ผู้สร้างลิงก์</span><b>{d.stats.owners}</b></div>
      <div className="ad-stat"><span>Key ที่ออกแล้ว</span><b>{keys}</b></div>
      <div className="ad-stat"><span>แมพใน Hub</span><b>{maps}</b></div>
    </section>
    <div className="ad-grid ad-g2">
      <section className="pn"><div className="pn-h"><h2>สร้างลิงก์ใหม่</h2><span className="grow"/><small>กำหนดโค้ดลิงก์เองได้</small></div>
        <LinkForm endpoint="/api/admin/vault" admin onCreated={load}/></section>
      <section className="pn" style={{minWidth:0}}>
        <div className="pn-h"><h2>ลิงก์ทั้งหมด</h2><small>{rows.length} จาก {d.links.length} รายการ</small><span className="grow"/><input className="search" placeholder="ค้นหาโค้ด / ชื่อ / ผู้สร้าง" value={q} onChange={e=>setQ(e.target.value)}/></div>
        <div className="ad-tw"><table>
          <thead><tr><th>ลิงก์</th><th>ผู้สร้าง</th><th className="num">ยอดรัน</th><th>สถานะ</th><th style={{textAlign:'right'}}>จัดการ</th></tr></thead>
          <tbody>
            {!ready&&<tr><td colSpan={5} className="empty">กำลังโหลด…</td></tr>}
            {ready&&rows.length===0&&<tr><td colSpan={5} className="empty">{d.links.length?'ไม่พบลิงก์ที่ค้นหา':'ยังไม่มีลิงก์ — สร้างลิงก์แรกได้จากฟอร์มด้านซ้าย'}</td></tr>}
            {rows.map(v=><tr key={v.code}>
              <td><div className="t">{v.title}</div><div className="s">{v.code}</div></td>
              <td><button className="chip" onClick={()=>openProf(v)}><Avatar src={v.owner_avatar} name={v.owner_name} size={20}/>{v.owner_name||'-'}</button></td>
              <td className="num">{(v.views||0).toLocaleString()}</td>
              <td><span style={{display:'flex',gap:6}}>{v.has_password&&<span className="pill warn">ล็อกรหัส</span>}{v.needs_key?<span className="pill blue">ต้องใช้ key</span>:<span className="pill">เปิด</span>}</span></td>
              <td><div className="acts">
                <button className="btn ghost sm" onClick={()=>copy(ls(v.raw_url),v.code)}>{cp===v.code?'คัดลอกแล้ว ✓':'Loadstring'}</button>
                {d.hosts.length>1&&<button className="btn ghost sm" title="ลองโดเมนสำรองอัตโนมัติถ้าโดเมนหลักถูก Cloudflare บล็อก" onClick={()=>copy(failover(d.hosts,'/raw/'+v.code),v.code+'f')}>{cp===v.code+'f'?'คัดลอกแล้ว ✓':'Failover'}</button>}
                <a className="btn ghost sm" href={v.raw_url} target="_blank" rel="noreferrer">Raw</a>
                <button className="btn ghost sm" onClick={()=>toggleKey(v)}>{v.needs_key?'ปิด key':'บังคับ key'}</button>
                <button className="btn ghost sm" onClick={()=>setPl(v.code)}>ผู้เล่น</button>
                <a className="btn ghost sm" href={`/vault/${v.code}`}>เปิด</a>
                <button className="btn danger sm" onClick={()=>del(v.code)}>ลบ</button></div></td></tr>)}
          </tbody></table></div>
      </section>
    </div>
    {prof&&<ProfileModal p={prof} links={d.links.filter(v=>v.owner_id===prof.id)} onClose={()=>setProf(null)} onPlayers={c=>{setProf(null);setPl(c)}}/>}
    {pl&&<Modal onClose={()=>setPl(null)}><h3 className="mdl-t">ผู้เล่นที่รัน · {pl}</h3><PlayersList code={pl}/></Modal>}
  </>);
}
