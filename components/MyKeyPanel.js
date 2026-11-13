'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
// รับคีย์ฟรี — ต้องติดตาม YouTube + เข้าร่วม Discord ก่อน (เข้าร่วม Discord ถูกตรวจจริงผ่านบอท ไม่ใช่แค่กดยืนยันเอง)
export default function MyKeyPanel(){
  const [info, setInfo] = useState(undefined), [yt, setYt] = useState(false), [busy, setBusy] = useState(false), [cp, setCp] = useState(false), [err, setErr] = useState('');
  const load = useCallback(() => fetch('/api/me/key', { cache:'no-store' }).then(r => r.json()).then(setInfo).catch(() => setInfo(null)), []);
  useEffect(() => { load(); }, [load]);
  async function claim(){ setBusy(true); setErr('');
    try{ const r = await fetch('/api/me/key', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ youtube:yt }) }), d = await r.json();
      if(!r.ok) setErr(d.message || 'รับคีย์ไม่สำเร็จ'); else setInfo(d); }
    catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); } setBusy(false); }
  const copy = (k) => { navigator.clipboard.writeText(k); setCp(true); setTimeout(() => setCp(false), 1200); };
  if(info === undefined) return <div className="dz-card" style={{ padding:22 }}><div className="sk" style={{ height:80, borderRadius:14 }}/></div>;
  if(!info?.enabled) return <div className="dz-empty"><Icon n="key" size={26}/><b>ยังไม่เปิดใช้งานระบบคีย์ผ่าน Discord</b><span>ติดต่อแอดมินถ้าต้องการใช้งานฟีเจอร์นี้</span></div>;
  const k = info.key;
  return (<div className="mk dz-card" style={{ padding:22 }}>
    <div className="tp-h"><span className="tp-gift" style={{ background:'linear-gradient(145deg,#5865F2,#3b45c4)' }}><Icon n="key" size={24}/></span>
      <div><h3>รับคีย์ฟรี</h3><p>ทำ 2 ขั้นตอนด้านล่างให้ครบ แล้วรับคีย์ไว้เปิด Hub ที่ต้องใช้ key</p></div></div>
    {!k ? <>
      <ol className="mk-gate">
        <li><span className="mk-n">1</span><div><b>ติดตาม YouTube ของเรา</b>
          {info.youtube_url && <a href={info.youtube_url} target="_blank" rel="noreferrer" className="dz-btn" style={{ marginTop:8 }}><Icon n="play" size={14}/>เปิดช่อง YouTube</a>}
          <label className="mk-ck"><input type="checkbox" checked={yt} onChange={e => setYt(e.target.checked)}/><span className="cf-tg" aria-hidden="true"><i/></span>ฉันติดตามแล้ว</label></div></li>
        <li><span className="mk-n">2</span><div><b>เข้าร่วม Discord ของเรา</b><small>ระบบจะตรวจสอบจริงตอนกดรับคีย์ว่าคุณอยู่ในเซิร์ฟเวอร์แล้วหรือยัง</small>
          {info.discord_url && <a href={info.discord_url} target="_blank" rel="noreferrer" className="dz-btn" style={{ marginTop:8, background:'#5865F2', borderColor:'#5865F2', color:'#fff' }}><Icon n="users" size={14}/>เข้าร่วม Discord</a>}</div></li>
      </ol>
      <button className="cf-go tp-go" disabled={busy || !yt} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังตรวจสอบ…' : <>รับคีย์ <Icon n="spark" size={17}/></>}</span></button>
      {err && <div className="cf-err err" style={{ marginTop:12 }}>{err}</div>}
    </> : <>
      <div className="mk-key"><code>{k.key}</code><button className="tp-p" onClick={() => copy(k.key)}><Icon n={cp ? 'check' : 'copy'} size={14}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
      <div className="lf-tags" style={{ marginTop:14 }}>
        <span className="on"><Icon n="bolt" size={12}/>ใช้แล้ว {k.runs.toLocaleString()} ครั้ง</span>
        <span className={k.bound ? 'on' : ''}><Icon n="shield" size={12}/>{k.bound ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูกเครื่อง'}</span>
        <span><Icon n="users" size={12}/>รับไปแล้ว {k.claims.toLocaleString()} ครั้ง</span>
        {k.revoked && <span style={{ color:'#fda4af' }}><Icon n="shield" size={12}/>ถูกเพิกถอนแล้ว</span>}
      </div>
      <div style={{ marginTop:18, fontSize:13, color:'var(--dim)' }}>หมดอายุ: {k.exp ? new Date(k.exp).toLocaleDateString('th-TH', { dateStyle:'long' }) : 'ไม่มีกำหนด'}</div>
      {err && <div className="cf-err err" style={{ marginTop:12 }}>{err}</div>}
    </>}
  </div>);
}
