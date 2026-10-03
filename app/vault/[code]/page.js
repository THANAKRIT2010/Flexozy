'use client';
import { useEffect, useState, use } from 'react';
import hljs from 'highlight.js/lib/core';
import lua from 'highlight.js/lib/languages/lua';
import 'highlight.js/styles/vs2015.css';
import PlayerList from '@/components/PlayerList';
hljs.registerLanguage('lua', lua);
export default function Paste({ params }){
  const {code}=use(params);
  const [m,setM]=useState(null),[text,setText]=useState(''),[title,setTitle]=useState('FLEXOZY'),[views,setViews]=useState(0);
  const [mode,setMode]=useState('loadstring'),[pw,setPw]=useState(''),[msg,setMsg]=useState({t:'กำลังโหลด',bad:false}),[need,setNeed]=useState(false),[cp,setCp]=useState(''),[ready,setReady]=useState(false);
  const ls=m?`loadstring(game:HttpGet("${m.raw_url}"))()`:'';
  async function unlock(p){
    try{const r=await fetch(`/api/vault/${encodeURIComponent(code)}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
      if(r.status===401){setPw('');setNeed(true);setMsg({t:'รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง',bad:true});return}
      if(!r.ok)throw Error();
      const d=await r.json();setText(d.script);setTitle(d.title||'FLEXOZY');setViews(v=>v+1);setNeed(false);setReady(true);
      setMode(d.script.split('\n').filter(l=>l.trim()).length>100?'loadstring':'script');
    }catch{setMsg({t:'โหลดไม่สำเร็จ กรุณาลองอีกครั้ง',bad:true})}
  }
  useEffect(()=>{(async()=>{try{const r=await fetch(`/api/vault/${encodeURIComponent(code)}/meta`);if(!r.ok){setMsg({t:'ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว',bad:true});return}
    const d=await r.json();setM(d);setTitle(d.title||'FLEXOZY');setViews(d.views||0);
    if(d.has_password){setNeed(true);setMsg({t:'ลิงก์นี้ถูกล็อกด้วยรหัสผ่าน',bad:false})}else unlock('');
  }catch{setMsg({t:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',bad:true})}})()},[code]);
  const shown=mode==='script'?text:mode==='raw'?m?.raw_url||'':ls;
  const html=ready&&mode!=='raw'?hljs.highlight(shown,{language:'lua'}).value:'';
  async function copy(){try{await navigator.clipboard.writeText(shown);setCp('ok');setTimeout(()=>setCp(''),1200)}catch{setCp('error')}}
  return <div className="pg"><div className="vault-shell"><header className="vault-top"><a href="/" className="vault-back">← กลับหน้าแรก</a><span className="eyebrow">FLEXOZY / VAULT</span></header>
    <div className="vault-heading"><span className="eyebrow"><span className="online-dot"/> SCRIPT DETAIL / {code}</span><h1>{title}</h1><p>เข้าถึงสคริปต์และลิงก์สำหรับใช้งาน</p></div>
    <div className="frame"><div className="bar"><div className="brand"><img src="/images/flexozy-logo.png" alt=""/><span>{title}</span></div><div className="pill">{views.toLocaleString()} <span>ครั้ง</span></div></div>
      <div className="toolbar"><div className="tab-group"><button className={mode==='script'?'on':''} disabled={!ready} onClick={()=>setMode('script')}>Script</button><button className={mode==='loadstring'?'on':''} disabled={!ready} onClick={()=>setMode('loadstring')}>Loadstring</button><button className={mode==='raw'?'on':''} disabled={!ready} onClick={()=>setMode('raw')}>Raw</button></div><button className="btn ghost" disabled={!ready} onClick={copy}>{cp==='ok'?'คัดลอกแล้ว':cp==='error'?'ลองอีกครั้ง':'คัดลอก'}</button></div>
      <div className="body">{ready?<pre><code className="hljs">{mode==='raw'?shown:<span dangerouslySetInnerHTML={{__html:html}}/>}</code></pre>:<div className={'msg'+(msg.bad?' bad':'')}><p>{msg.t}</p>{need&&<div className="unlock"><input type="password" value={pw} placeholder="ใส่รหัสผ่าน" onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock(pw)}/><button className="btn" onClick={()=>unlock(pw)}>ปลดล็อก →</button></div>}</div>}</div>
      <div className="frame-foot"><PlayerList code={code}/><span>RAW · {m?.raw_url ? new URL(m.raw_url).host : 'api.flexozy.xyz'}</span></div>
    </div></div></div>;
}
