'use client';
import { useEffect, useState, use } from 'react';
import hljs from 'highlight.js/lib/core'; import lua from 'highlight.js/lib/languages/lua';
import 'highlight.js/styles/vs2015.css';
import { PlayersList } from '@/components/Ui';
hljs.registerLanguage('lua', lua);
export default function Paste({ params }){
  const { code: rawCode } = use(params);
  const code = (()=>{ try{ return decodeURIComponent(rawCode) }catch{ return rawCode } })().split('=')[0]; // กันกรณีเปิดลิงก์ที่มี =ตัวอักษรสุ่ม ต่อท้าย
  const [m,setM]=useState(null), [text,setText]=useState(''), [title,setTitle]=useState('FLEXOZY'), [views,setViews]=useState(0);
  const [mode,setMode]=useState('loadstring'), [pw,setPw]=useState(''), [msg,setMsg]=useState({t:'กำลังโหลด',bad:false}), [need,setNeed]=useState(false), [cp,setCp]=useState(false), [ready,setReady]=useState(false);
  const ls=m?`loadstring(game:HttpGet("${m.raw_url}"))()`:'';
  async function unlock(p){
    const r=await fetch(`/api/vault/${code}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
    if(r.status===401){ setPw(''); setNeed(true); return setMsg({t:'รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง',bad:true}); }
    if(!r.ok) return setMsg({t:'โหลดไม่สำเร็จ',bad:true});
    const d=await r.json(); setText(d.script); setTitle(d.title||'FLEXOZY'); setViews(v=>v+1); setNeed(false); setReady(true); 
    setMode(d.script.split('\n').filter(l=>l.trim()).length>100?'loadstring':'script');
  }
  // address bar: /vault/CODE=ตัวอักษรสุ่มยาว ๆ เปลี่ยนไปเรื่อย ๆ (แก้เฉพาะ URL ที่เห็น ไม่โหลดหน้าใหม่ ไม่กระทบการทำงานของหน้า)
  useEffect(()=>{
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', put=History.prototype.replaceState; // เรียกตัวจริงตรง ๆ ไม่ผ่านตัวครอบของ Next
    const rnd=()=>{ let s=''; for(const x of crypto.getRandomValues(new Uint8Array(64+Math.floor(Math.random()*64)))) s+=A[x%A.length]; return s; };
    let ms=100, t;
    const tick=()=>{ if(!document.hidden){ try{ put.call(history,history.state,'',`/vault/${code}=${rnd()}`); }catch{ ms=Math.min(ms*2,2000); } } t=setTimeout(tick,ms); }; // Safari จำกัดจำนวนครั้ง → ถ้าโดนบล็อกจะช้าลงเอง
    tick();
    return ()=>{ clearTimeout(t); try{ put.call(history,history.state,'',`/vault/${code}`); }catch{} };
  },[code]);
  useEffect(()=>{ (async()=>{
    try{ const r=await fetch(`/api/vault/${code}/meta`); if(!r.ok) return setMsg({t:'ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว',bad:true});
      const d=await r.json(); setM(d); setTitle(d.title||'FLEXOZY'); setViews(d.views||0);
      if(d.has_password && !d.admin_bypass){ setNeed(true); setMsg({t:'ลิงก์นี้ถูกล็อกด้วยรหัสผ่าน',bad:false}); } else unlock('');
    }catch{ setMsg({t:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',bad:true}); } })(); },[code]);
  const shown=mode==='script'?text:mode==='raw'?(m?m.raw_url:''):ls;
  const html=ready?(mode==='raw'?shown.replace(/&/g,'&amp;').replace(/</g,'&lt;'):hljs.highlight(shown,{language:'lua'}).value):'';
  return (<div className="pg"><div className="frame">
    <div className="bar"><div className="brand"><img src="/images/flexozy-logo.png" alt=""/><span>{title}</span></div>
      <div className="act">
        <button className={mode==='script'?'on':''} disabled={!ready} onClick={()=>setMode('script')}>Script</button>
        <button className={mode==='loadstring'?'on':''} disabled={!ready} onClick={()=>setMode('loadstring')}>Loadstring</button>
        <button disabled={!m} onClick={()=>window.open(m.raw_url,'_blank','noopener')}>Raw</button>
        {m?.can_manage&&<button className={mode==='players'?'on':''} onClick={()=>setMode('players')}>Players</button>}
        <button disabled={!ready||mode==='players'} onClick={()=>{navigator.clipboard.writeText(shown);setCp(true);setTimeout(()=>setCp(false),1200)}}>{cp?'Copied':'Copy'}</button>
        <div className="pill"><span className="hs">Views:</span><b>{views.toLocaleString()}</b></div>
      </div></div>
    <div className="body">{mode==='players'?<PlayersList code={code}/>:ready
      ? <pre><code className="hljs" dangerouslySetInnerHTML={{__html:html}}/></pre>
      : <div className={'msg'+(msg.bad?' bad':'')}>{msg.t}
          {need&&<><input type="password" value={pw} placeholder="ใส่รหัสผ่าน" onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock(pw)}/><button className="btn" onClick={()=>unlock(pw)}>ปลดล็อก</button></>}</div>}
    </div></div></div>);
}
