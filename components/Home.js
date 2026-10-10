'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm, { ls, copyText } from '@/components/LinkForm';
import { Avatar, Modal, ProfileModal, PlayersList } from '@/components/Ui';
import CountUp from '@/components/CountUp';
import Icon from '@/components/Icons';
export default function Home({ site }){
  const { hero, stats, countMs } = site;
  const [me,setMe]=useState(undefined), [list,setList]=useState([]), [cp,setCp]=useState(''), [prof,setProf]=useState(false), [pl,setPl]=useState(null);
  const load=useCallback(async()=>{ const r=await fetch('/api/vault'); if(r.ok) setList(await r.json()); },[]);
  useEffect(()=>{ fetch('/api/me').then(r=>r.json()).then(d=>{ setMe(d.authenticated?d.user:null); if(d.authenticated) load(); }); },[load]);
  async function del(code){ if(!confirm('ลบลิงก์นี้?')) return; await fetch('/api/vault/'+code,{method:'DELETE'}); load(); }
  const copy=(t,k)=>{copyText(t);setCp(k);setTimeout(()=>setCp(''),1200)};
  return (<div className="fx"><div className="fx-bg"><i/><i/></div>
    <header className="tn"><div className="tn-in">
      <a className="tn-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>FLEXOZY</b></a><span className="grow"/>
      {me===null && <a className="btn pri" href="/login/discord">เข้าสู่ระบบด้วย Discord</a>}
      {me && <>{me.is_admin&&<a className="btn ghost" href="/admin">หลังบ้าน</a>}
        <button className="who" onClick={()=>setProf(true)}><Avatar src={me.avatar} name={me.username} size={28}/><span className="who-n">{me.username}</span></button>
        <a className="btn ghost" href="/logout">ออก</a></>}
    </div></header>
    <main className="wrap hm">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true"/>
        {hero.badge && <span className="hero-badge rv" style={{'--i':0}}><i/>{hero.badge}</span>}
        <h1 className="hero-t rv" style={{'--i':1}}>{hero.title}</h1>
        <p className="hero-p rv" style={{'--i':2}}>{hero.tagline}</p>
        <div className="hero-cta rv" style={{'--i':3}}>
          {me===null && <a className="btn pri lg" href="/login/discord">เริ่มต้นใช้งาน <Icon n="arrow" size={18}/></a>}
          {me && <a className="btn pri lg" href="#create">สร้างลิงก์ใหม่ <Icon n="arrow" size={18}/></a>}
        </div>
      </section>
      {stats.length>0 && <section className="sx" aria-label="สถิติ">{stats.map((s,i)=>
        <div className="sx-c rv" style={{'--i':i+4}} key={s.id}>
          <div className="sx-wm" aria-hidden="true"><Icon n={s.icon} size={76}/></div>
          <div className="sx-ic"><Icon n={s.icon} size={22}/></div>
          <div className="sx-tx"><div className="sx-l">{s.label}</div><div className="sx-v"><CountUp to={s.value} ms={countMs}/>{s.unit&&<small>{s.unit}</small>}</div></div>
        </div>)}</section>}
      <section id="create" className="hm-sec">
        {me===undefined && <div className="msg">กำลังโหลด…</div>}
        {me===null && <div className="card gate rv"><div className="gate-ic"><Icon n="shield" size={26}/></div><h2>เข้าสู่ระบบเพื่อสร้างลิงก์</h2><p>ใช้บัญชี Discord ของคุณ — วางโค้ด แปลงเป็นลิงก์ ตั้งรหัสผ่านได้ และดูคนรันในเกมได้</p><a className="btn pri lg" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></div>}
        {me && <><div className="sec-h"><h2>สร้างลิงก์สคริปต์</h2><p>วางโค้ด Lua แล้วรับ loadstring พร้อมใช้ทันที</p></div><LinkForm endpoint="/api/vault" onCreated={load}/></>}
        {me&&list.length>0&&<div className="card mylinks"><div className="f-h" style={{marginTop:0}}>ลิงก์ของฉัน <em>{list.length} ลิงก์</em></div>
          {list.map(v=><div className="item" key={v.code}><div style={{minWidth:0}}><div className="t">{v.title}{v.has_password&&' 🔒'}</div><div className="s">{v.code} · {v.views} views</div></div>
            <div className="row"><button className="btn ghost" onClick={()=>copy(ls(v.raw_url),v.code)}>{cp===v.code?'Copied ✓':'Loadstring'}</button>
              <a className="btn ghost" href={v.raw_url} target="_blank" rel="noreferrer">Raw</a>
              <button className="btn ghost" onClick={()=>setPl(v.code)}>ผู้เล่น</button>
              <a className="btn ghost" href={`/vault/${v.code}`}>เปิด</a><button className="btn ghost" onClick={()=>del(v.code)}>ลบ</button></div></div>)}
        </div>}
      </section>
      <footer className="foot">© {new Date().getFullYear()} Flexozy</footer>
    </main>
    {prof&&me&&<ProfileModal p={{name:me.username,avatar:me.avatar,id:me.id,tag:me.is_admin?'ADMIN':'',logout:true}} links={list} onClose={()=>setProf(false)} onPlayers={c=>{setProf(false);setPl(c)}}/>}
    {pl&&<Modal onClose={()=>setPl(null)}><h3 className="mdl-t">ผู้เล่นที่รัน · {pl}</h3><PlayersList code={pl}/></Modal>}
  </div>);
}
