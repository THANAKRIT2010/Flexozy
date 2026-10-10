'use client';
import { useState, useRef, useMemo } from 'react';
import Turnstile from './Turnstile';
import Icon from './Icons';
import { ls } from '@/lib/snippets';
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', bad_slug:'โค้ดลิงก์ใช้ได้เฉพาะ A-Z a-z 0-9 _ - ยาว 4–40 ตัว และห้ามซ้ำคำสงวน', slug_taken:'โค้ดลิงก์นี้ถูกใช้แล้ว',
  turnstile_required:'กรุณารอการตรวจสอบความปลอดภัยให้เสร็จก่อน', turnstile_failed:'การตรวจสอบความปลอดภัยไม่ผ่าน ลองใหม่อีกครั้ง', pow_required:'การตรวจสอบความปลอดภัยยังไม่เสร็จ',
  empty_script:'กรุณาวางโค้ด', too_large:'โค้ดยาวเกิน 200,000 ตัวอักษร', rate_limited:'สร้างลิงก์ถี่เกินไป รอสักครู่แล้วลองใหม่' };
export { ls };
export const copyText = (t) => navigator.clipboard.writeText(t);
const MAX = 200000;
export default function LinkForm({ endpoint, admin, onCreated, hosts = [] }){
  const empty = { title:'', script:'', password:'', slug:'', needs_key:false };
  const [f,setF]=useState(empty), [human,setHuman]=useState(null), [k,setK]=useState(0), [showPw,setShowPw]=useState(false);
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState('');
  const gut = useRef(null);
  const set=n=>e=>setF(p=>({...p,[n]:e.target.value}));
  const copy=(t,id)=>{copyText(t);setCp(id);setTimeout(()=>setCp(''),1200)};
  const lines = useMemo(()=>f.script ? f.script.split('\n').length : 1, [f.script]);
  const nums = useMemo(()=>{ const n=Math.min(Math.max(lines,12),5000); let o=''; for(let i=1;i<=n;i++) o+=i+'\n'; return o; },[lines]);
  const pct = Math.min(100, f.script.length / MAX * 100);
  async function pasteClip(){ try{ const t = await navigator.clipboard.readText(); if(t) setF(p=>({...p,script:t.slice(0,MAX)})); }catch{ setErr('เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ด — กด Ctrl+V ในช่องโค้ดแทน'); } }
  async function submit(e){
    e.preventDefault(); if(!human) return; setBusy(true); setErr('');
    let r, d; try{ r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,...human})}); d=await r.json().catch(()=>({})); }catch{ r={ok:false}; d={}; }
    setBusy(false); setHuman(null); setK(x=>x+1); // โจทย์/โทเคนใช้ได้ครั้งเดียว → ขอใหม่ทุกครั้ง
    if(!r.ok) return setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ');
    setRes(d); setF(empty); onCreated?.();
  }
  const Out=({l,v,id,hot})=><div className={'cf-out'+(hot?' hot':'')}><span className="cf-out-l">{l}</span>
    <div className="cf-out-r"><input readOnly value={v} onFocus={e=>e.target.select()}/><button type="button" className={'cf-cp'+(cp===id?' ok':'')} onClick={()=>copy(v,id)}><Icon n={cp===id?'check':'copy'} size={15}/>{cp===id?'คัดลอกแล้ว':'คัดลอก'}</button></div></div>;
  return (<div className="cf-wrap">
    <form className="cf" onSubmit={submit}>
      <div className="cf-ed">
        <div className="cf-ed-bar">
          <span className="cf-dots" aria-hidden="true"><i/><i/><i/></span>
          <input className="cf-name" value={f.title} onChange={set('title')} placeholder="ตั้งชื่อสคริปต์ (ไม่บังคับ)" maxLength={120} aria-label="ชื่อลิงก์"/>
          <span className="cf-lang"><Icon n="code" size={13}/>LUA</span>
        </div>
        <div className="cf-ed-body">
          <pre className="cf-gut" ref={gut} aria-hidden="true">{nums}</pre>
          <textarea className="cf-ta" required value={f.script} onChange={set('script')} onScroll={e=>{ if(gut.current) gut.current.scrollTop=e.target.scrollTop; }}
            placeholder={'-- วางโค้ด Lua ของคุณที่นี่\nprint("Hello, Flexozy!")'} spellCheck={false} wrap="off" maxLength={MAX}/>
        </div>
        <div className="cf-ed-foot">
          <span className="cf-st"><b>{lines.toLocaleString()}</b> บรรทัด</span>
          <span className="cf-st"><b>{f.script.length.toLocaleString()}</b> / {MAX.toLocaleString()}</span>
          <span className="cf-meter" aria-hidden="true"><i style={{width:pct+'%'}} className={pct>90?'hot':''}/></span>
          <button type="button" className="cf-mini" onClick={pasteClip}><Icon n="paste" size={14}/>วางจากคลิปบอร์ด</button>
          {f.script && <button type="button" className="cf-mini" onClick={()=>setF(p=>({...p,script:''}))}><Icon n="trash" size={14}/>ล้าง</button>}
        </div>
      </div>

      <div className="cf-opts">
        <div className="cf-opt">
          <div className="cf-opt-h"><span className="cf-opt-ic"><Icon n="lock" size={16}/></span><div><b>รหัสผ่านหน้าดูโค้ด</b><small>เว้นว่าง = ใครก็เปิดหน้าดูได้</small></div></div>
          <div className="cf-pw"><input type={showPw?'text':'password'} value={f.password} onChange={set('password')} placeholder="ตั้งรหัสผ่าน (ไม่บังคับ)" maxLength={128} autoComplete="new-password"/>
            <button type="button" className="cf-eye" onClick={()=>setShowPw(v=>!v)} aria-label="แสดง/ซ่อนรหัสผ่าน"><Icon n={showPw?'eyeoff':'eye'} size={16}/></button></div>
        </div>
        {admin && <div className="cf-opt">
          <div className="cf-opt-h"><span className="cf-opt-ic"><Icon n="link" size={16}/></span><div><b>โค้ดลิงก์ที่กำหนดเอง</b><small>เว้นว่างเพื่อสุ่มให้อัตโนมัติ</small></div></div>
          <input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub" maxLength={40}/>
        </div>}
        {admin && <label className={'cf-opt cf-sw'+(f.needs_key?' on':'')}>
          <div className="cf-opt-h"><span className="cf-opt-ic"><Icon n="key" size={16}/></span><div><b>ต้องใช้ key (ผูก HWID)</b><small>ถึงจะโหลดสคริปต์ได้</small></div></div>
          <input type="checkbox" checked={f.needs_key} onChange={e=>setF(p=>({...p,needs_key:e.target.checked}))}/><span className="cf-tg" aria-hidden="true"><i/></span>
        </label>}
      </div>

      <Turnstile key={k} onChange={setHuman}/>
      <button className="cf-go" disabled={busy||!human}>
        <span className="cf-go-t">{busy?'กำลังสร้าง...':human?<>สร้างลิงก์<Icon n="spark" size={17}/></>:'กำลังตรวจสอบความปลอดภัย...'}</span>
      </button>
      {err&&<div className="err cf-err">{err}</div>}
    </form>
    {res&&<div className="cf-res"><div className="cf-res-h"><span className="cf-res-ic"><Icon n="check" size={18}/></span><div><b>สร้างลิงก์สำเร็จ!</b><small>คัดลอก loadstring ไปวางใน executor ได้ทันที</small></div></div>
      <Out hot l="โค้ดพร้อมใช้ (วางใน executor)" v={ls(res.raw_url)} id="b"/>
      <Out l="ลิงก์หน้าดูโค้ด" v={`${location.origin}/vault/${res.code}`} id="a"/>
      <Out l="Raw URL" v={res.raw_url} id="c"/></div>}
  </div>);
}
