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
  const [res,setRes]=useState(null), [err,setErr]=useState(''), [busy,setBusy]=useState(false), [cp,setCp]=useState(''), [lock,setLock]=useState(false);
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
  const origin = typeof location!=='undefined'?location.origin:'', lines2 = f.script ? f.script.split('\n').length : 0;
  const pickLock = (v) => { setLock(v); if(!v) setF(p=>({...p,password:''})); };
  return (<form className="cf mq" onSubmit={submit}>
    <div className="mq-controls">
      <div className="mq-left">
        <div className="mq-pills" role="radiogroup" aria-label="การเข้าถึง"><button type="button" className={!lock?'on':''} onClick={()=>pickLock(false)}><Icon n="eye" size={13}/>สาธารณะ</button><button type="button" className={lock?'on':''} onClick={()=>pickLock(true)}><Icon n="lock" size={13}/>ล็อกรหัสผ่าน</button></div>
        {admin&&<div className="mq-pills" role="radiogroup" aria-label="key"><button type="button" className={!f.needs_key?'on':''} onClick={()=>setF(p=>({...p,needs_key:false}))}>ไม่ใช้ key</button><button type="button" className={f.needs_key?'on':''} onClick={()=>setF(p=>({...p,needs_key:true}))}><Icon n="key" size={13}/>ใช้ key (HWID)</button></div>}
        {!admin&&lock&&<span className="mq-note"><Icon n="bolt" size={13}/>หัก <b>{lockCost.toLocaleString()}</b> TOKEN{tokens!==null&&<> · เหลือ <b>{tokens.toLocaleString()}</b></>}</span>}
      </div>
      <button className="mq-go" disabled={busy||!human}>{busy?'กำลังสร้าง...':human?<>สร้างลิงก์<Icon n="spark" size={15}/></>:'กำลังตรวจสอบ...'}</button>
    </div>
    <div className="mq-deck">
      <section className="mq-box">
        <div className="mq-head"><div className="mq-ttl"><span className="mq-dot"/><span className="mq-fn">source.lua</span><span className="mq-meta">{lines.toLocaleString()} บรรทัด · {f.script.length.toLocaleString()} B</span></div>
          <div className="mq-ttl"><button type="button" className="mq-b" onClick={pasteClip}><Icon n="paste" size={12}/>วางโค้ด</button>{f.script&&<button type="button" className="mq-b" onClick={()=>setF(p=>({...p,script:''}))}><Icon n="trash" size={12}/>ล้าง</button>}</div></div>
        <div className="mq-nm"><input value={f.title} onChange={set('title')} placeholder="ตั้งชื่อสคริปต์ (ไม่บังคับ)" maxLength={120} aria-label="ชื่อลิงก์"/><i style={{width:pct+'%'}} className={pct>90?'hot':''}/></div>
        <div className="mq-ed"><pre className="cf-gut" ref={gut} aria-hidden="true">{nums}</pre>
          <textarea className="cf-ta" required value={f.script} onChange={set('script')} onScroll={e=>{ if(gut.current) gut.current.scrollTop=e.target.scrollTop; }} placeholder={'-- วางโค้ด Lua ของคุณที่นี่\nprint("Hello, Flexozy!")'} spellCheck={false} wrap="off" maxLength={MAX}/></div>
      </section>
      <section className="mq-box">
        <div className="mq-head"><div className="mq-ttl"><span className={'mq-dot'+(res?' ok':'')}/><span className="mq-fn">{res?'ready.lua':'link.lua'}</span></div>
          <div className="mq-ttl">{res&&<button type="button" className="mq-b" onClick={()=>copy(ls(res.raw_url),'b')}><Icon n="copy" size={12}/>{cp==='b'?'คัดลอกแล้ว':'คัดลอก'}</button>}</div></div>
        {res ? <div className="mq-out"><div className="mq-ok"><span className="cf-res-ic"><Icon n="check" size={18}/></span><div><b>สร้างลิงก์สำเร็จ!</b><small>คัดลอก loadstring ไปวางใน executor ได้ทันที</small></div></div>
            <Out hot l="โค้ดพร้อมใช้ (วางใน executor)" v={ls(res.raw_url)} id="b"/><Out l="ลิงก์หน้าดูโค้ด" v={`${origin}/vault/${res.code}`} id="a"/><Out l="Raw URL" v={res.raw_url} id="c"/></div>
        : <div className="mq-out">
            <div className="mq-code"><div><i>1</i><span className="c">-- ลิงก์ของคุณจะอยู่ตรงนี้</span></div><div><i>2</i><span><em>loadstring</em>(game:<em>HttpGet</em>(<u>"{origin}/raw/••••••••"</u>))()</span></div></div>
            {lock&&<div className="mq-f"><label><Icon n="lock" size={13}/>รหัสผ่านหน้าดูโค้ด</label><div className="cf-pw"><input type={showPw?'text':'password'} value={f.password} onChange={set('password')} placeholder="ตั้งรหัสผ่าน" maxLength={128} autoComplete="new-password"/><button type="button" className="cf-eye" onClick={()=>setShowPw(v=>!v)} aria-label="แสดง/ซ่อนรหัสผ่าน"><Icon n={showPw?'eyeoff':'eye'} size={16}/></button></div></div>}
            {admin&&<div className="mq-f"><label><Icon n="link" size={13}/>โค้ดลิงก์ที่กำหนดเอง</label><input value={f.slug} onChange={set('slug')} placeholder="เช่น flexozy-hub (เว้นว่าง = สุ่ม)" maxLength={40}/></div>}
            <div className="lf-tags"><span className={lines2?'on':''}><Icon n="code" size={12}/>{lines2?lines2+' บรรทัด':'ยังไม่มีโค้ด'}</span><span className={lock?'on':''}><Icon n="lock" size={12}/>{lock?'ล็อกรหัส':'เปิดสาธารณะ'}</span>{admin&&<span className={f.needs_key?'on':''}><Icon n="key" size={12}/>{f.needs_key?'ต้องใช้ key':'ไม่ใช้ key'}</span>}</div>
            <div className="mq-ts"><Turnstile key={k} onChange={setHuman}/></div>{err&&<div className="err cf-err">{err}</div>}</div>}
      </section>
    </div>
    {res&&err&&<div className="err cf-err">{err}</div>}
  </form>);
}
