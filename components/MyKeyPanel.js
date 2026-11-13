'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
// คีย์ของบัญชี Discord นี้เอง — ออกให้อัตโนมัติตอนล็อกอิน ใช้เปิด Hub/สคริปต์ที่ต้องใช้ key ได้ทันที
export default function MyKeyPanel(){
  const [info, setInfo] = useState(undefined), [busy, setBusy] = useState(false), [cp, setCp] = useState(false), [err, setErr] = useState('');
  const load = useCallback(() => fetch('/api/me/key', { cache:'no-store' }).then(r => r.json()).then(setInfo).catch(() => setInfo(null)), []);
  useEffect(() => { load(); }, [load]);
  async function claim(){ setBusy(true); setErr('');
    try{ const r = await fetch('/api/me/key', { method:'POST' }), d = await r.json();
      if(!r.ok) setErr(d.error === 'revoked' ? 'คีย์เดิมของคุณถูกเพิกถอนแล้ว ติดต่อแอดมิน' : 'เคลมคีย์ไม่สำเร็จ ลองใหม่อีกครั้ง'); else setInfo(d); }
    catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); } setBusy(false); }
  const copy = (k) => { navigator.clipboard.writeText(k); setCp(true); setTimeout(() => setCp(false), 1200); };
  if(info === undefined) return <div className="dz-card" style={{ padding:22 }}><div className="sk" style={{ height:80, borderRadius:14 }}/></div>;
  if(!info?.enabled) return <div className="dz-empty"><Icon n="key" size={26}/><b>ยังไม่เปิดใช้งานระบบคีย์ผ่าน Discord</b><span>ติดต่อแอดมินถ้าต้องการใช้งานฟีเจอร์นี้</span></div>;
  const k = info.key;
  return (<div className="mk dz-card" style={{ padding:22 }}>
    <div className="tp-h"><span className="tp-gift" style={{ background:'linear-gradient(145deg,#5865F2,#3b45c4)' }}><Icon n="key" size={24}/></span>
      <div><h3>คีย์ของคุณ</h3><p>ผูกกับบัญชี Discord นี้ ใช้เปิด Hub ที่ต้องใช้ key ได้ทันที</p></div></div>
    {!k ? <>
      <div className="tp-off">ยังไม่มีคีย์ — ปกติระบบจะออกให้อัตโนมัติตอนล็อกอิน ถ้ายังไม่เห็น กดเคลมได้เลย</div>
      <button className="cf-go tp-go" disabled={busy} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังเคลม…' : <>เคลมคีย์ <Icon n="spark" size={17}/></>}</span></button>
    </> : <>
      <div className="mk-key"><code>{k.key}</code><button className="tp-p" onClick={() => copy(k.key)}><Icon n={cp ? 'check' : 'copy'} size={14}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
      <div className="lf-tags" style={{ marginTop:14 }}>
        <span className="on"><Icon n="bolt" size={12}/>ใช้แล้ว {k.runs.toLocaleString()} ครั้ง</span>
        <span className={k.bound ? 'on' : ''}><Icon n="shield" size={12}/>{k.bound ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูกเครื่อง'}</span>
        <span><Icon n="users" size={12}/>เคลม/ล็อกอินแล้ว {k.claims.toLocaleString()} ครั้ง</span>
        {k.revoked && <span style={{ color:'#fda4af' }}><Icon n="shield" size={12}/>ถูกเพิกถอนแล้ว</span>}
      </div>
      <div style={{ marginTop:18, fontSize:13, color:'var(--dim)' }}>หมดอายุ: {k.exp ? new Date(k.exp).toLocaleDateString('th-TH', { dateStyle:'long' }) : 'ไม่มีกำหนด'}</div>
      {err && <div className="cf-err err" style={{ marginTop:12 }}>{err}</div>}
    </>}
  </div>);
}
