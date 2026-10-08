'use client';
import { useEffect, useState, use } from 'react';
import hljs from 'highlight.js/lib/core'; import lua from 'highlight.js/lib/languages/lua';
import 'highlight.js/styles/vs2015.css';
import { PlayersList } from '@/components/Ui';
import KeysPanel from '@/components/Keys';
hljs.registerLanguage('lua', lua);
export default function Paste({ params }){
  const { code } = use(params);
  const [m,setM]=useState(null), [text,setText]=useState(''), [title,setTitle]=useState('FLEXOZY'), [views,setViews]=useState(0);
  const [hidden,setHidden]=useState(false), [mode,setMode]=useState('loadstring'), [pw,setPw]=useState(''), [msg,setMsg]=useState({t:'กำลังโหลด',bad:false}), [need,setNeed]=useState(false), [cp,setCp]=useState(false), [ready,setReady]=useState(false);
  const ls=m?`${m.lic?'script_key="ใส่คีย์ของคุณที่นี่"\n':''}loadstring(game:HttpGet("${m.raw_url}"))()`:'';
  async function unlock(p){
    const r=await fetch(`/api/vault/${code}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})});
    if(r.status===401){ setPw(''); setNeed(true); return setMsg({t:'รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง',bad:true}); }
    if(!r.ok) return setMsg({t:'โหลดไม่สำเร็จ',bad:true});
    const d=await r.json(); setTitle(d.title||'FLEXOZY'); setNeed(false); setReady(true);
    if(d.hidden){ setHidden(true); setText(''); return setMode('loadstring'); } // ลิงก์ซ่อนโค้ด: เห็นแค่ loadstring
    setText(d.script); setViews(v=>v+1);
    setMode(d.script.split('\n').filter(l=>l.trim()).length>100?'loadstring':'script');
  }
  useEffect(()=>{ (async()=>{
    try{ const r=await fetch(`/api/vault/${code}/meta`); if(!r.ok) return setMsg({t:'ไม่พบลิงก์นี้ หรือถูกลบไปแล้ว',bad:true});
      const d=await r.json(); setM(d); setTitle(d.title||'FLEXOZY'); setViews(d.views||0);
      if(d.has_password){ setNeed(true); setMsg({t:'ลิงก์นี้ถูกล็อกด้วยรหัสผ่าน',bad:false}); } else unlock('');
    }catch{ setMsg({t:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',bad:true}); } })(); },[code]);
  const shown=mode==='script'?text:mode==='raw'?(m?m.raw_url:''):ls;
  const html=ready?(mode==='raw'?shown.replace(/&/g,'&amp;').replace(/</g,'&lt;'):hljs.highlight(shown,{language:'lua'}).value):'';
  return (<div className="pg"><div className="frame">
    <div className="bar"><div className="brand"><img src="/images/flexozy-logo.png" alt=""/><span>{title}</span></div>
      <div className="act">
        <button className={mode==='script'?'on':''} disabled={!ready||hidden} onClick={()=>setMode('script')}>Script</button>
        <button className={mode==='loadstring'?'on':''} disabled={!ready} onClick={()=>setMode('loadstring')}>Loadstring</button>
        <button disabled={!m} onClick={()=>window.open(m.raw_url,'_blank','noopener')}>Raw</button>
        {m?.can_manage&&<button className={mode==='players'?'on':''} onClick={()=>setMode('players')}>Players</button>}
        {m?.can_manage&&<button className={mode==='keys'?'on':''} onClick={()=>setMode('keys')}>Keys</button>}
        <button disabled={!ready||mode==='players'||mode==='keys'} onClick={()=>{navigator.clipboard.writeText(shown);setCp(true);setTimeout(()=>setCp(false),1200)}}>{cp?'Copied':'Copy'}</button>
        <div className="pill"><span className="hs">Views:</span><b>{views.toLocaleString()}</b></div>
      </div></div>
    <div className="body">{mode==='players'?<PlayersList code={code}/>:mode==='keys'?<KeysPanel code={code} onSettings={j=>setM(x=>({...x,...j}))}/>:ready
      ? <pre><code className="hljs" dangerouslySetInnerHTML={{__html:html}}/></pre>
      : <div className={'msg'+(msg.bad?' bad':'')}>{msg.t}
          {need&&<><input type="password" value={pw} placeholder="ใส่รหัสผ่าน" onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock(pw)}/><button className="btn" onClick={()=>unlock(pw)}>ปลดล็อก</button></>}</div>}
    </div></div></div>);
}
