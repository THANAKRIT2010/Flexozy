'use client';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Ui';
import Icon from '@/components/Icons';

const ERR = { daily_limit:'รีเซ็ต HWID ได้วันละ 1 ครั้ง ลองใหม่พรุ่งนี้', no_key:'ยังไม่มีคีย์ที่ผูกกับบัญชี', login:'กรุณาเข้าสู่ระบบใหม่', bad_action:'คำขอไม่ถูกต้อง' };
const short = (v) => v && v.length > 30 ? v.slice(0, 30) + '…' : v;

export default function AccountPage(){
  const [d, setD] = useState(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null);
  const load = () => fetch('/api/account', { cache:'no-store' }).then(r => r.json()).then(setD).catch(() => setD({ authenticated:false }));
  useEffect(() => { load(); }, []);

  async function reset(){
    if(!confirm('รีเซ็ต HWID ของคีย์นี้ใช่ไหม? (ทำได้วันละ 1 ครั้ง)')) return;
    setBusy(true); setMsg(null);
    const r = await fetch('/api/account', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action:'reset_hwid' }) });
    const j = await r.json().catch(() => ({}));
    setMsg(j.err ? { bad:ERR[j.err] || 'รีเซ็ตไม่สำเร็จ' } : { ok:'รีเซ็ต HWID แล้ว เปิดสคริปต์ครั้งถัดไปจะผูกเครื่องใหม่' });
    if(!j.err) load();
    setBusy(false);
  }

  if(d === null) return <main className="kp"><div className="kp-wrap"><div className="kp-card kp-sk"/></div></main>;
  if(!d.authenticated) return (<main className="kp"><header className="kp-top"><a className="kp-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/>FLEXOZY</a></header>
    <div className="kp-wrap"><div className="kp-card kp-center"><b>กรุณาเข้าสู่ระบบ</b><p className="kp-sub">ใช้บัญชี Discord เพื่อดูบัญชีของคุณ</p><a className="kp-btn lk" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></div></div></main>);

  const hw = d.hwid, linked = !!(hw && hw.bound);
  return (<main className="kp">
    <header className="kp-top">
      <a className="kp-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/>FLEXOZY</a>
      <span className="kp-grow"/>
      <span className="kp-me"><Avatar src={d.user.avatar} name={d.user.username} size={24}/>{d.user.username}</span>
    </header>
    <div className="kp-wrap">
      <a className="kp-back" href="/">← Dashboard</a>
      <div className="kp-acc-h"><Avatar src={d.user.avatar} name={d.user.username} size={56}/><div><h1>Account</h1><p className="kp-sub">เข้าสู่ระบบในชื่อ <b>{d.user.username}</b></p></div></div>

      <div className="kp-sec">PROFILE</div>
      <div className="kp-card kp-list">
        <div className="kp-row"><span className="kp-ic"><Icon n="user" size={16}/></span><div><b>Discord</b><small>{d.user.username}</small></div></div>
        <div className="kp-row"><span className="kp-ic"><Icon n="key" size={16}/></span><div><b>Discord ID</b><small>{d.user.id}</small></div></div>
        <div className="kp-row"><span className="kp-ic"><Icon n="bolt" size={16}/></span><div><b>สถานะคีย์</b><small>{d.key_active ? 'ใช้งานได้' : 'ยังไม่มีคีย์ใช้งาน'}</small></div></div>
      </div>

      <div className="kp-sec">DEVICE & SECURITY</div>
      <div className="kp-card kp-list">
        <div className="kp-row"><span className="kp-ic"><Icon n="box" size={16}/></span>
          <div className="kp-grow1"><b>Linked PC</b><small className="mono">{linked ? short(hw.value) || 'ผูกแล้ว' : 'ยังไม่ผูกเครื่อง'}</small></div>
          <button className="kp-btn ghost" onClick={reset} disabled={!linked || busy}>{busy ? '...' : 'Reset HWID'}</button></div>
        {msg && <div className={msg.ok ? 'kp-ok' : 'kp-err'}>{msg.ok || msg.bad}</div>}
      </div>

      <div className="kp-sec">SIGN OUT</div>
      <div className="kp-card kp-list">
        <div className="kp-row"><span className="kp-ic"><Icon n="logout" size={16}/></span>
          <div className="kp-grow1"><b>Sign out</b><small>ออกจากระบบในเบราว์เซอร์นี้</small></div>
          <a className="kp-btn ghost" href="/logout">Sign out</a></div>
      </div>
    </div>
  </main>);
}
