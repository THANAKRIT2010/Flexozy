'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
const empty = () => ({ id:'', name:'', placeIds:'', aliases:'', url:'' });
const toForm = (g) => ({ ...g, placeIds:(g.placeIds||[]).join(', '), aliases:(g.aliases||[]).join(', ') });
const toData = (g) => ({ ...g, placeIds:String(g.placeIds||'').split(/[\s,;]+/).filter(Boolean), aliases:String(g.aliases||'').split(',').map(x=>x.trim()).filter(Boolean) });
const slug = (n) => String(n).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
const firstId = (g) => String(g.placeIds||'').split(/[\s,;]+/).find(x => /^\d+$/.test(x) && Number(x) > 0);
function Icon({ g, thumbs }){ const u = thumbs[firstId(g)]; return <div className="ad-ico">{u ? <img src={u} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/> : (g.name||'?').slice(0,1).toUpperCase()}</div>; }
export default function GameManager(){
  const [games,setGames]=useState([]), [edit,setEdit]=useState(null), [form,setForm]=useState(empty()), [query,setQuery]=useState(''), [busy,setBusy]=useState(false), [msg,setMsg]=useState(null), [custom,setCustom]=useState(false), [thumbs,setThumbs]=useState({}), [dirty,setDirty]=useState(false);
  const flash = (t, bad=false) => setMsg({ t, bad });
  const load = useCallback(async()=>{ setBusy(true); try{ const r=await fetch('/api/admin/games',{cache:'no-store'}), d=await r.json(); if(!r.ok) throw Error(d.error||'โหลดข้อมูลไม่สำเร็จ'); setGames((d.games||[]).map(toForm)); setCustom(!!d.custom); setDirty(false); }catch(e){ flash(e.message,true) } finally{ setBusy(false) } },[]);
  useEffect(()=>{ load() },[load]);
  // ไอคอนผ่านเซิร์ฟเวอร์ (เบราว์เซอร์ยิง Roblox ตรงไม่ได้ เพราะ CORS) — ขอเฉพาะ id ที่ยังไม่มี
  useEffect(()=>{ const need=[...new Set(games.map(firstId).filter(i=>i && !(i in thumbs)))]; if(!need.length) return; let off=false;
    (async()=>{ try{ const r=await fetch('/api/admin/thumbs?ids='+need.join(',')); if(r.ok){ const d=await r.json(); if(!off) setThumbs(p=>({...p,...d})); } else if(!off) setThumbs(p=>({...p,...Object.fromEntries(need.map(i=>[i,'']))})); }catch{ if(!off) setThumbs(p=>({...p,...Object.fromEntries(need.map(i=>[i,'']))})); } })(); return ()=>{ off=true } },[games,thumbs]);
  const filtered = useMemo(()=>games.map((g,i)=>({g,i})).filter(({g})=>(g.name+' '+g.id+' '+g.placeIds+' '+g.aliases).toLowerCase().includes(query.toLowerCase())),[games,query]);
  const startNew = () => { setEdit(-1); setForm(empty()); };
  const startEdit = (i) => { setEdit(i); setForm({ ...games[i] }); };
  const up = (k,v) => setForm(p=>({...p,[k]:v}));
  function saveLocal(){
    const name = form.name.trim(); if(!name) return flash('กรุณากรอกชื่อแมพ', true);
    const url = form.url.trim(); if(url && !/^https:\/\//i.test(url)) return flash('URL ต้องขึ้นต้นด้วย https://', true);
    let id = slug(form.id.trim() || name) || 'map-' + Math.random().toString(36).slice(2,7);
    if(games.some((g,i)=>g.id===id && i!==edit)) return flash(`Map Key “${id}” ซ้ำกับแมพอื่น — เปลี่ยนรหัสภายใน`, true);
    const next = { ...form, id, name, url };
    setGames(p => edit === -1 ? [...p, next] : p.map((g,i)=>i===edit ? next : g)); setEdit(null); setDirty(true);
    flash('แก้ไขในแบบร่างแล้ว — กด “บันทึกทั้งหมด” เพื่อใช้งานจริง');
  }
  function remove(i){ if(!confirm(`ลบแมพ “${games[i].name}” ?`)) return; setGames(p=>p.filter((_,n)=>n!==i)); setDirty(true); flash('ลบออกจากแบบร่างแล้ว — กด “บันทึกทั้งหมด” เพื่อยืนยัน'); }
  async function publish(){ setBusy(true); setMsg(null); try{ const r=await fetch('/api/admin/games',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({games:games.map(toData)})}), d=await r.json(); if(!r.ok) throw Error(d.error||'บันทึกไม่สำเร็จ'); setGames((d.games||[]).map(toForm)); setCustom(true); setDirty(false); flash('บันทึกแล้ว — Hub ใช้รายการนี้ทันทีในการรันครั้งถัดไป'); }catch(e){ flash(e.message,true) } finally{ setBusy(false) } }
  async function reset(){ if(!confirm('คืนค่ารายการแมพเริ่มต้นของโปรเจกต์?')) return; setBusy(true); try{ const r=await fetch('/api/admin/games',{method:'DELETE'}); if(!r.ok) throw Error('คืนค่าไม่สำเร็จ'); await load(); flash('คืนค่ารายการเริ่มต้นแล้ว'); }catch(e){ flash(e.message,true) } finally{ setBusy(false) } }
  const prev = (filtered.length ? filtered : games.map((g,i)=>({g,i}))).slice(0,6);
  return (<div className="ad-grid ad-g3">
    <section className="pn" style={{minWidth:0}}>
      <div className="pn-h"><h2>รายการแมพของ Hub</h2><small>{games.length} แมพ{dirty&&' · มีการแก้ไขที่ยังไม่บันทึก'}</small><span className="grow"/>
        <input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาชื่อ / ID / Place ID"/>
        <button className="btn ghost" onClick={startNew}>＋ เพิ่มแมพ</button><button className="btn" disabled={busy||!dirty} onClick={publish}>{busy?'กำลังบันทึก…':'บันทึกทั้งหมด'}</button></div>
      {msg&&<div className="ad-note" role="status" style={msg.bad?{borderColor:'var(--red)',color:'#ffb4ae'}:undefined}>{msg.t}</div>}
      {edit!==null&&<div className="ad-edit"><div className="pn-h" style={{marginBottom:6}}><h2>{edit===-1?'เพิ่มแมพใหม่':'แก้ไขแมพ'}</h2><span className="grow"/><button className="btn ghost sm" onClick={()=>setEdit(null)}>ปิด</button></div>
        <div className="ad-fields">
          <div><label>ชื่อแมพ — ใช้จับคู่และรันด้วยชื่อได้</label><input value={form.name} onChange={e=>up('name',e.target.value)} placeholder="เช่น Murder Mystery 2"/></div>
          <div><label>Map Key (รหัสภายใน)</label><input value={form.id} onChange={e=>up('id',e.target.value)} placeholder="เช่น mm2 — เว้นว่างเพื่อสร้างจากชื่อ"/><small>a-z 0-9 และ - เท่านั้น ห้ามซ้ำกัน</small></div>
          <div><label>Place ID / Universe ID</label><input value={form.placeIds} onChange={e=>up('placeIds',e.target.value)} placeholder="142823291, 123456789"/><small>ใส่ได้หลายค่า คั่นด้วย , — ใช้ได้ทั้ง Place ID และ Universe ID</small></div>
          <div><label>ชื่ออื่นสำหรับจับคู่ (alias)</label><input value={form.aliases} onChange={e=>up('aliases',e.target.value)} placeholder="MM2, Murder Mystery"/><small>ใช้ตอนพิมพ์ชื่อแมพในหน้า Settings ของ Hub และเมื่อ Place ID ไม่ตรง</small></div>
          <div className="full"><label>Script URL</label><input value={form.url} onChange={e=>up('url',e.target.value)} placeholder="https://raw.githubusercontent.com/..."/><small>HTTPS โดเมนสาธารณะเท่านั้น (ห้าม IP / localhost) — ผู้ใช้ไม่เห็น URL นี้ เซิร์ฟเวอร์ดึงให้</small></div></div>
        <div className="row" style={{justifyContent:'flex-end',marginTop:14}}><button className="btn" onClick={saveLocal}>ใช้ข้อมูลนี้</button></div></div>}
      <div className="ad-maps">
        {filtered.map(({g,i})=><article className="ad-map" key={g.id+'-'+i}><Icon g={g} thumbs={thumbs}/>
          <div className="mi"><b>{g.name}</b><small>{g.id} · {g.placeIds||'จับคู่ด้วยชื่อ'}</small></div>
          {g.url?<span className="pill ok">พร้อมรัน</span>:<span className="pill bad">ไม่มี URL</span>}
          <button className="btn ghost sm" onClick={()=>startEdit(i)}>แก้ไข</button><button className="btn danger sm" onClick={()=>remove(i)}>ลบ</button></article>)}
        {!filtered.length&&<div className="empty">ไม่พบแมพที่ค้นหา</div>}</div>
      <div className="row" style={{marginTop:16,justifyContent:'space-between'}}><small style={{color:'var(--dim)'}}>{custom?'กำลังใช้รายการที่บันทึกไว้':'กำลังใช้รายการเริ่มต้นของโปรเจกต์'}</small><button className="btn ghost sm" disabled={busy} onClick={reset}>คืนค่าเริ่มต้น</button></div>
    </section>
    <aside className="ad-prev"><div className="ad-prev-top"><i/>ตัวอย่างหน้าตา Hub ในเกม</div>
      <div className="ad-mock"><div className="ad-mock-side"><div className="lg"><img src="/images/flexozy-logo.png" alt=""/><div><b>Flexozy</b><small>SCRIPT HUB</small></div></div>
        <div className="ad-mock-tab on">Recommend</div><div className="ad-mock-tab">All Scripts</div><div className="ad-mock-tab">Credits</div><div className="ad-mock-tab">DEV</div></div>
        <div className="ad-mock-main"><h4>All Scripts</h4><p>Search and browse all supported games</p>
          <div className="ad-mock-cards">{prev.map(({g,i})=><div className="ad-mock-card" key={g.id+i}><Icon g={g} thumbs={thumbs}/><div style={{minWidth:0}}><b>{g.name}</b><small>{g.url?'พร้อมรัน':'ยังไม่มีลิงก์'}</small></div></div>)}</div></div></div>
      <div className="ad-prev-foot">รูปไอคอนดึงจาก Roblox ตาม Place ID · ปุ่ม Settings ในเกมมีช่อง “Run by Map Name”</div></aside>
  </div>);
}
