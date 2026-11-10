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
export default function LinkForm({ endpoint, admin, onCreated, hosts = [], tokens = null, lockCost = 1000 }){
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
    if(d.error==='insufficient_tokens') return setErr(`TOKEN ไม่พอ — ล็อกรหัสผ่านใช้ ${(d.need||lockCost).toLocaleString()} TOKEN (คงเหลือ ${(d.balance??0).toLocaleString()}) · เว้นรหัสผ่านไว้เพื่อฝากฟรี`);
    if(!r.ok) return setErr(MSG[d.error]||'สร้างลิงก์ไม่สำเร็จ');
    setRes(d); setF(empty); onCreated?.();
  }
  const Out=({l,v,id,hot})=><div className={'cf-out'+(hot?' hot':'')}><span className="cf-out-l">{l}</span>
    <div className="cf-out-r"><input readOnly value={v} onFocus={e=>e.target.select()}/><button type="button" className={'cf-cp'+(cp===id?' ok':'')} onClick={()=>copy(v,id)}><Icon n={cp===id?'check':'copy'} size={15}/>{cp===id?'คัดลอกแล้ว':'คัดลอก'}</button></div></div>;
  const live = res ? '' : `loadstring(game:HttpGet("${typeof location!=='undefined'?location.origin:''}/raw/••••••••"))()`;
  const lines2 = f.script ? f.script.split('\n').length : 0;
  return (<div className="lf">
    {res&&<div className="cf-res lf-done"><div className="cf-res-h"><span className="cf-res-ic"><Icon n="check" size={18}/></span><div><b>สร้างลิงก์สำเร็จ!</b><small>คัดลอก loadstring ไปวางใน executor ได้ทันที</small></div></div>
      <Out hot l="โค้ดพร้อมใช้ (วางใน executor)" v={ls(res.raw_url)} id="b"/><Out l="ลิงก์หน้าดูโค้ด" v={`${location.origin}/vault/${res.code}`} id="a"/><Out l="Raw URL" v={res.raw_url} id="c"/></div>}
    <form className="cf lf-grid" onSubmit={submit}>
      <div className="lf-main">
        <div className="cf-ed">
          <div className="cf-ed-bar"><span className="cf-dots" aria-hidden="true"><i/><i/><i/></span>
            <input className="cf-name" value={f.title} onChange={set('title')} placeholder="ตั้งชื่อสคริปต์ (ไม่บังคับ)" maxLength={120} aria-label="ชื่อลิงก์"/><span className="cf-lang"><Icon n="code" size={13}/>LUA</span></div>
          <div className="cf-ed-body"><pre className="cf-gut" ref={gut} aria-hidden="true">{nums}</pre>
            <textarea className="cf-ta" required value={f.script} onChange={set('script')} onScroll={e=>{ if(gut.current) gut.current.scrollTop=e.target.scrollTop; }} placeholder={'-- วางโค้ด Lua ของคุณที่นี่\nprint("Hello, Flexozy!")'} spellCheck={false} wrap="off" maxLength={MAX}/></div>
          <div className="cf-ed-foot"><span className="cf-st"><b>{lines.toLocaleString()}</b> บรรทัด</span><span className="cf-st"><b>{f.script.length.toLocaleString()}</b> / {MAX.toLocaleString()}</span>
            <span className="cf-meter" aria-hidden="true"><i style={{width:pct+'%'}} className={pct>90?'hot':''}/></span>
            <button type="button" className="cf-mini" onClick={pasteClip}><Icon n="paste" size={14}/>วางจากคลิปบอร์ด</button>
            {f.script&&<button type="button" className="cf-mini" onClick={()=>setF(p=>({...p,script:''}))}><Icon n="trash" size={14}/>ล้าง</button>}</div>
        </div>
      </div>
      <aside className="lf-side">
        <div className="lf-card"><div className="lf-step"><b>1</b><div><h4>ตั้งค่าความปลอดภัย</h4><small>เลือกเอง ไม่บังคับ</small></div></div>
          <div className="lf-f"><label><Icon n="lock" size={14}/>รหัสผ่านหน้าดูโค้ด</label><div className="cf-pw"><input type={showPw?'text':'password'} value={f.password} onChange={set('password')} placeholder="เว้นว่าง = ใครก็เปิดดูได้" maxLength={128} autoComplete="new-password"/>
            <button type="button" className="cf-eye" onClick={()=>setShowPw(v=>!v)} aria-label="แสดง/ซ่อนรหัสผ่าน"><Icon n={showPw?'eyeoff':'eye'} size={16}/></button></div>
            {!admin&&<div className="tk-note"><Icon n="bolt" size={13}/>ใส่รหัสผ่านหัก <b>{lockCost.toLocaleString()}</b> TOKEN{tokens!==null&&<> · เหลือ <b>{tokens.toLocaleString()}</b></>}</div>}</div>
          {admin&&<div className="lf-f"><label><Icon n="link" size={14}/>โค้ดลิงก์ที่กำหนดเอง</label><input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub (เว้นว่าง = สุ่ม)" maxLength={40}/></div>}
          {admin&&<label className={'lf-sw'+(f.needs_key?' on':'')}><span><Icon n="key" size={15}/><b>ต้องใช้ key (ผูก HWID)</b></span><input type="checkbox" checked={f.needs_key} onChange={e=>setF(p=>({...p,needs_key:e.target.checked}))}/><span className="cf-tg" aria-hidden="true"><i/></span></label>}
        </div>
        <div className="lf-card"><div className="lf-step"><b>2</b><div><h4>ตัวอย่างที่จะได้</h4><small>ลิงก์จริงสร้างหลังกดปุ่ม</small></div></div>
          <code className="lf-pv">{live}</code>
          <div className="lf-tags"><span className={lines2?'on':''}><Icon n="code" size={12}/>{lines2?lines2+' บรรทัด':'ยังไม่มีโค้ด'}</span><span className={f.password?'on':''}><Icon n="lock" size={12}/>{f.password?'ล็อกรหัส':'เปิดสาธารณะ'}</span>{admin&&<span className={f.needs_key?'on':''}><Icon n="key" size={12}/>{f.needs_key?'ต้องใช้ key':'ไม่ใช้ key'}</span>}</div></div>
        <div className="lf-card"><div className="lf-step"><b>3</b><div><h4>ยืนยันและสร้าง</h4><small>ตรวจสอบความปลอดภัยอัตโนมัติ</small></div></div>
          <Turnstile key={k} onChange={setHuman}/>
          <button className="cf-go" disabled={busy||!human}><span className="cf-go-t">{busy?'กำลังสร้าง...':human?<>สร้างลิงก์<Icon n="spark" size={17}/></>:'กำลังตรวจสอบความปลอดภัย...'}</span></button>
          {err&&<div className="err cf-err">{err}</div>}</div>
      </aside>
    </form>
  </div>);
}
