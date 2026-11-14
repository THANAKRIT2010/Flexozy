'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
// รับคีย์ฟรี — จัดเลย์เอาต์แบบ "เวลาคงเหลือ": การ์ดสถานะคีย์ด้านบน + ลิสต์งานที่ต้องทำ (ติดตาม YouTube + เข้าร่วม Discord) ด้านล่าง
// เข้าร่วม Discord ตรวจสอบจริงผ่านบอทตอนกดรับคีย์ · YouTube เป็นการยืนยันด้วยตัวเอง (ดู v25.3)
const fmtLeft = (ms) => { if(ms <= 0) return '0 วัน 0 ชม.'; const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000); return `${d} วัน ${h} ชม.`; };
export default function MyKeyPanel({ me }){
  const [info, setInfo] = useState(undefined), [yt, setYt] = useState(false), [busy, setBusy] = useState(false), [cp, setCp] = useState(false), [err, setErr] = useState('');
  const load = useCallback(() => fetch('/api/me/key', { cache:'no-store' }).then(r => r.json()).then(setInfo).catch(() => setInfo(null)), []);
  useEffect(() => { load(); }, [load]);
  async function claim(){ setBusy(true); setErr('');
    try{ const r = await fetch('/api/me/key', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ youtube:yt }) }), d = await r.json();
      if(!r.ok) setErr(d.message || 'รับคีย์ไม่สำเร็จ'); else setInfo(d); }
    catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); } setBusy(false); }
  const copy = (k) => { navigator.clipboard.writeText(k); setCp(true); setTimeout(() => setCp(false), 1200); };
  if(info === undefined) return <div className="dz-card" style={{ padding:22 }}><div className="sk" style={{ height:120, borderRadius:14 }}/></div>;
  if(!info?.enabled) return <div className="dz-empty"><Icon n="key" size={26}/><b>ยังไม่เปิดใช้งานระบบคีย์ผ่าน Discord</b><span>ติดต่อแอดมินถ้าต้องการใช้งานฟีเจอร์นี้</span></div>;
  const k = info.key, now = Date.now(), left = k?.exp ? k.exp - now : null, pct = left !== null ? Math.max(2, Math.min(100, left / (30 * 86400000) * 100)) : 0;
  return (<div className="mk">
    <div className="mk-hey"><h2>สวัสดี, {me?.username}</h2><p>เวลาที่เหลือของคีย์ และวิธีรับ/ต่ออายุคีย์</p></div>

    <div className="dz-card mk-bal">
      <div className="mk-bal-h"><span>คีย์ของคุณ</span>{k && <span className={'mk-pill' + (k.revoked ? ' off' : '')}>{k.revoked ? 'ถูกเพิกถอน' : 'ใช้งานอยู่'}</span>}</div>
      {!k ? <div className="mk-none"><Icon n="key" size={30}/><b>ยังไม่มีคีย์</b><span>ทำ 2 ขั้นตอนด้านล่างให้ครบ แล้วกดรับคีย์</span></div> : <>
        <div className="mk-time">{k.exp ? fmtLeft(left) : 'ไม่มีกำหนดหมดอายุ'}</div>
        {k.exp && <div className="mk-bar"><i style={{ width:pct + '%' }}/></div>}
        <div className="mk-sub">{k.exp ? `หมดอายุ ${new Date(k.exp).toLocaleString('th-TH', { dateStyle:'long', timeStyle:'short' })}` : 'ใช้ได้ตลอดไปจนกว่าแอดมินจะเพิกถอน'}</div>
      </>}
    </div>

    <div className="mk-earn">
      <div className="mk-earn-h"><span>รับ / ต่ออายุคีย์</span><small>ทำให้ครบ 2 ข้อ แล้วกดปุ่มด้านล่าง</small></div>
      <div className="mk-row">
        <span className="mk-ic" style={{ background:'linear-gradient(145deg,#ff4d4d,#b30000)' }}><Icon n="play" size={18}/></span>
        <div className="mk-row-t"><b>ติดตาม YouTube</b><small>เปิดช่องแล้วกดติดตาม จากนั้นติ๊กยืนยันด้านขวา</small></div>
        {info.youtube_url && <a href={info.youtube_url} target="_blank" rel="noreferrer" className="mk-start">เปิด</a>}
        <label className="mk-ck"><input type="checkbox" checked={yt} onChange={e => setYt(e.target.checked)} disabled={!!k && !k.revoked}/><span className="cf-tg" aria-hidden="true"><i/></span></label>
      </div>
      <div className="mk-row">
        <span className="mk-ic" style={{ background:'linear-gradient(145deg,#5865F2,#3b45c4)' }}><Icon n="users" size={18}/></span>
        <div className="mk-row-t"><b>เข้าร่วม Discord</b><small>ระบบตรวจสอบจริงตอนกดรับคีย์ว่าเข้าร่วมแล้วหรือยัง</small></div>
        {info.discord_url && <a href={info.discord_url} target="_blank" rel="noreferrer" className="mk-start" style={{ background:'#5865F2' }}>เข้าร่วม</a>}
      </div>
      {!k || k.revoked
        ? <button className="cf-go mk-go" disabled={busy || !yt} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังตรวจสอบ…' : <>{k?.revoked ? 'ขอคีย์ใหม่' : 'รับคีย์'} <Icon n="spark" size={17}/></>}</span></button>
        : <button className="cf-go mk-go" disabled={busy} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังต่ออายุ…' : <>ต่ออายุคีย์ <Icon n="spark" size={17}/></>}</span></button>}
      {err && <div className="cf-err err" style={{ marginTop:12 }}>{err}</div>}
    </div>

    {k && <div className="dz-card mk-keybox">
      <div className="mk-key"><code>{k.key}</code><button className="tp-p" onClick={() => copy(k.key)}><Icon n={cp ? 'check' : 'copy'} size={14}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
      <div className="lf-tags" style={{ marginTop:14 }}>
        <span className="on"><Icon n="bolt" size={12}/>ใช้แล้ว {k.runs.toLocaleString()} ครั้ง</span>
        <span className={k.bound ? 'on' : ''}><Icon n="shield" size={12}/>{k.bound ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูกเครื่อง'}</span>
        <span><Icon n="users" size={12}/>รับไปแล้ว {k.claims.toLocaleString()} ครั้ง</span>
      </div>
    </div>}
  </div>);
}
