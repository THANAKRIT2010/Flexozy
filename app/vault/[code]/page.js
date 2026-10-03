'use client';
import { useEffect, useState, use } from 'react';
import hljs from 'highlight.js/lib/core'; import lua from 'highlight.js/lib/languages/lua';
import 'highlight.js/styles/vs2015.css';
hljs.registerLanguage('lua', lua);
export default function Paste({ params }){
  const { code } = use(params);
  const [m,setM]=useState(null), [text,setText]=useState(''), [title,setTitle]=useState('FLEXOZY'), [views,setViews]=useState(0);
  const [mode,setMode]=useState('loadstring'), [pw,setPw]=useState(''), [msg,setMsg]=useState({t:'กำลังโหลด',bad:false}), [need,setNeed]=useState(false), [cp,setCp]=useState(false), [ready,setReady]=useState(false);
  const ls=m?`loadstring(game:HttpGet("${m.raw_url}"))()`:'';
  async function unlock(p){
    const r=await fetch(`/api/vault/${code}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
    if(r.status===401){ setPw(''); setNeed(true); return setMsg({t:'รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง',bad:true}); }
    if(!r.ok) return setMsg({t:'โหลดไม่สำเร็จ',bad:true});
    const d=await r.json(); setText(d.script); setTitle(d.title||'FLEXOZY'); setViews(v=>v+1); setNeed(false); setReady(true); setPw(p);
    setMode(d.script.split('\n').filter(l=>l.trim()).length>100?'loadstring':'script');
  }
  useEffect(()=>{ (async()=>{
    try{ const r=await fetch(`/api/vault/${code}/meta`); if(!r.ok) return setMsg({t:'ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว',bad:true});
      const d=await r.json(); setM(d); setTitle(d.title||'FLEXOZY'); setViews(d.views||0);
      if(d.has_password){ setNeed(true); setMsg({t:'ลิงก์นี้ถูกล็อกด้วยรหัสผ่าน',bad:false}); } else unlock('');
    }catch{ setMsg({t:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',bad:true}); } })(); },[code]);
  const shown=mode==='script'?text:ls;
  const html=ready?hljs.highlight(shown,{language:'lua'}).value:'';
  return (<div className="pg"><div className="frame">
    <div className="bar"><div className="brand"><img src="/images/flexozy-logo.png" alt=""/><span>{title}</span></div>
      <div className="act">
        <button className={mode==='script'?'on':''} disabled={!ready} onClick={()=>setMode('script')}>Script</button>
        <button className={mode==='loadstring'?'on':''} disabled={!ready} onClick={()=>setMode('loadstring')}>Loadstring</button>
        <button disabled={!ready} onClick={()=>location.href=`/raw/vault/${code}${pw?'?password='+encodeURIComponent(pw):''}`}>Raw</button>
        <button disabled={!ready} onClick={()=>{navigator.clipboard.writeText(shown);setCp(true);setTimeout(()=>setCp(false),1200)}}>{cp?'Copied':'Copy'}</button>
        <div className="pill"><span className="hs">Views:</span><b>{views.toLocaleString()}</b></div>
      </div></div>
    <div className="body">{ready
      ? <pre><code className="hljs" dangerouslySetInnerHTML={{__html:html}}/></pre>
      : <div className={'msg'+(msg.bad?' bad':'')}>{msg.t}
          {need&&<><input type="password" value={pw} placeholder="ใส่รหัสผ่าน" onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock(pw)}/><button className="btn" onClick={()=>unlock(pw)}>ปลดล็อก</button></>}</div>}
    </div></div></div>);
}
