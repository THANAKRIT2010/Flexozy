'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
import { ago } from '@/components/Ui';
// คำขอล่าสุด (IP · HWID · Roblox) + แบน/ปลดบล็อก — แบนแล้วใช้ลิงก์/สคริปต์ที่ส่งผ่าน API ไม่ได้เลย
const HOURS = [['1', '1 ชม.'], ['24', '24 ชม.'], ['168', '7 วัน'], ['0', 'ถาวร']];
const SRC = { raw:'ลิงก์ /raw', auth:'Hub (key)', ping:'ในเกม', loader:'Loader', 'bootstrap-source':'Loader', 'bootstrap-info':'Loader', 'game-script':'เกมสคริป' };
const TYPE = { ip:'IP', hw:'HWID', uid:'Roblox ID' };
const post = (url, body, method = 'POST') => fetch(url, { method, headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) }).then(r => r.json().catch(() => ({}))).catch(() => ({}));
export default function BansPanel(){
  const [tab, setTab] = useState('seen'), [seen, setSeen] = useState(null), [bans, setBans] = useState([]), [q, setQ] = useState(''), [hours, setHours] = useState('24'), [reason, setReason] = useState(''),
    [busy, setBusy] = useState(''), [msg, setMsg] = useState(''), [cp, setCp] = useState(''), [man, setMan] = useState({ type:'ip', value:'' });
  const load = useCallback(async () => { const [a, b] = await Promise.all([fetch('/api/admin/seen', { cache:'no-store' }).then(r => r.json()).catch(() => ({})), fetch('/api/admin/bans', { cache:'no-store' }).then(r => r.json()).catch(() => ({}))]); setSeen(a.rows || []); setBans(b.bans || []); }, []);
  useEffect(() => { load(); }, [load]);
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };
  async function ban(targets, id){
    if(!targets.length) return; if(targets.length > 1 && !confirm(`แบน ${targets.map(t => TYPE[t.type]).join(' + ')} ?\nแบนแล้วใช้ลิงก์/สคริปต์ผ่าน API ไม่ได้ทั้งหมด`)) return;
    setBusy(id); const r = await post('/api/admin/bans', { targets, hours:Number(hours), reason }); setBusy('');
    if(r.ok){ flash(`แบนแล้ว ${r.bans.length} รายการ`); load(); } else flash('แบนไม่สำเร็จ: ' + (r.error || 'ข้อมูลไม่ถูกต้อง')); }
  async function unban(k){ if(!confirm('ปลดบล็อกรายการนี้ ?')) return; await post('/api/admin/bans', { k }, 'DELETE'); flash('ปลดบล็อกแล้ว'); load(); }
  const copy = (t, k) => { navigator.clipboard.writeText(String(t)); setCp(k); setTimeout(() => setCp(''), 1000); };
  const rows = useMemo(() => (seen || []).filter(r => !q || `${r.raw} ${r.ip} ${r.hw} ${r.un} ${r.dn} ${r.uid} ${r.code}`.toLowerCase().includes(q.toLowerCase())), [seen, q]);
  const autoBans = useMemo(() => bans.filter(b => b.auto), [bans]), manBans = useMemo(() => bans.filter(b => !b.auto), [bans]);
  const autoQ = useMemo(() => autoBans.filter(b => !q || `${b.ip} ${b.reason} ${b.label}`.toLowerCase().includes(q.toLowerCase())), [autoBans, q]);
  const now = Date.now(), live = (seen || []).filter(r => now - r.last < 600000).length;
  return (<div className="rn bn">
    <div className="rn-top"><div className="rn-st"><b>{(seen || []).length}</b><span>ผู้ส่งคำขอ</span></div><div className="rn-st on"><b>{live}</b><span>ใน 10 นาทีล่าสุด</span></div><div className="rn-st"><b>{bans.length}</b><span>ถูกแบนอยู่</span></div><div className="rn-st bn-auto-st"><b>{autoBans.length}</b><span>แบนอัตโนมัติ</span></div><span className="grow"/>
      <div className="mq-pills"><button type="button" className={tab === 'seen' ? 'on' : ''} onClick={() => setTab('seen')}>คำขอล่าสุด</button><button type="button" className={tab === 'bans' ? 'on' : ''} onClick={() => setTab('bans')}>รายการที่ถูกแบน</button><button type="button" className={tab === 'auto' ? 'on' : ''} onClick={() => setTab('auto')}>แบนอัตโนมัติ<em>{autoBans.length}</em></button></div></div>
    <div className="bn-bar"><div className="dz-find"><Icon n="eye" size={15}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหา IP / HWID / ชื่อ Roblox / โค้ดลิงก์"/></div>
      <label className="bn-f">ระยะเวลาแบน<select value={hours} onChange={e => setHours(e.target.value)}>{HOURS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="bn-f grow">เหตุผล (ไม่บังคับ)<input value={reason} onChange={e => setReason(e.target.value)} maxLength={120} placeholder="เช่น dump สคริป / แชร์ key"/></label><button className="dz-btn" onClick={load}>รีเฟรช</button></div>
    {msg && <div className="bn-msg">{msg}</div>}
    {tab === 'auto' ? (
      autoBans.length === 0 ? <div className="dz-empty"><Icon n="shield" size={26}/><b>ยังไม่มีการแบนอัตโนมัติ</b><span>ระบบจะแบนเองเมื่อ: ดึง /loader หรือ /raw ซ้ำโดยไม่ใช้ token, โดนปฏิเสธ token/proof ซ้ำเกินเกณฑ์, หรือคำขอไม่มีโปรไฟล์ Roblox/HWID</span></div>
      : <div className="rn-grid">{autoQ.map(b => <div className="dz-card rn-c bn-red" key={b.ip}>
          <div className="rn-h"><div className="rn-n"><b className="bn-ip" onClick={() => copy(b.ip, 'a' + b.ip)}>{cp === 'a' + b.ip ? 'คัดลอกแล้ว ✓' : (b.label && b.type !== 'ip' ? b.label : b.ip)}</b><small>{b.reason}</small></div><span className="rn-pill bn-pill">{TYPE[b.type || 'ip']}</span></div>
          <div className="rn-m"><span><Icon n="bolt" size={13}/>{b.exp ? 'หมดอายุ ' + new Date(b.exp).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' }) : 'ถาวร'}</span></div>
          <div className="rn-f"><button onClick={() => unban(b.ip)}>ปลดบล็อก (ไม่ใช่ความผิดพลาด?)</button></div></div>)}</div>
    ) : tab === 'seen' ? (seen === null ? <div className="rn-grid">{[0, 1, 2, 3].map(i => <div className="sk" style={{ height:170, borderRadius:18 }} key={i}/>)}</div>
      : rows.length === 0 ? <div className="dz-empty"><Icon n="users" size={26}/><b>ยังไม่มีคำขอที่บันทึกไว้</b><span>จะขึ้นเมื่อมีคนดึงลิงก์ /raw หรือรัน Hub</span></div>
      : <div className="rn-grid">{rows.map(r => { const all = [!r.b_ip && { type:'ip', value:r.raw || r.ip }, r.hw && !r.b_hw && { type:'hw', value:r.hw }, r.uid && !r.b_uid && { type:'uid', value:String(r.uid) }].filter(Boolean), id = r.ip;
        return (<div className={'dz-card rn-c' + ((r.b_ip || r.b_hw || r.b_uid) ? ' bn-red' : '')} key={id}>
          <div className="rn-h"><div className="rn-n"><b className="bn-ip" onClick={() => copy(r.raw || r.ip, 'i' + id)} title="คัดลอก IP">{cp === 'i' + id ? 'คัดลอกแล้ว ✓' : (r.raw || r.ip)}</b><small>{SRC[r.src] || r.src}{r.code && ` · ${r.code}`} · {r.n} คำขอ/24 ชม.</small></div><span className={'rn-pill' + (now - r.last < 600000 ? ' on' : '')}>{ago(r.last)}</span></div>
          <div className="rn-m">{r.uid ? <span><Icon n="users" size={13}/><a href={`https://www.roblox.com/users/${r.uid}/profile`} target="_blank" rel="noreferrer">{r.dn || r.un || r.uid}{r.un && ` (@${r.un})`}</a> · {r.uid}</span> : <span className="bn-d"><Icon n="users" size={13}/>ไม่ทราบโปรไฟล์ Roblox</span>}
            {r.hw ? <span onClick={() => copy(r.hw, 'h' + id)} style={{ cursor:'pointer' }} title="คัดลอก HWID"><Icon n="key" size={13}/>{cp === 'h' + id ? 'คัดลอกแล้ว ✓' : r.hw.slice(0, 22) + (r.hw.length > 22 ? '…' : '')}</span> : <span className="bn-d"><Icon n="key" size={13}/>ไม่ทราบ HWID (เห็นแค่ IP)</span>}</div>
          <div className="bn-tags">{r.b_ip && <i>IP ถูกแบน</i>}{r.b_hw && <i>HWID ถูกแบน</i>}{r.b_uid && <i>Roblox ถูกแบน</i>}</div>
          <div className="rn-f">{all.length > 0 && <button className="bn-all" disabled={busy === id} onClick={() => ban(all, id)}>{busy === id ? '…' : `แบน${all.length > 1 ? 'ทั้งหมด' : TYPE[all[0].type]}`}</button>}
            {all.length > 1 && all.map(t => <button key={t.type} onClick={() => ban([t], id)}>แบน {TYPE[t.type]}</button>)}</div></div>); })}</div>)
    : <>
      <div className="bn-man"><select value={man.type} onChange={e => setMan({ ...man, type:e.target.value })}><option value="ip">IP</option><option value="hw">HWID</option><option value="uid">Roblox ID</option></select>
        <input value={man.value} onChange={e => setMan({ ...man, value:e.target.value })} placeholder={man.type === 'ip' ? 'เช่น 1.2.3.4 หรือ IPv6 (แบนทั้งช่วง /64)' : man.type === 'hw' ? 'HWID เต็ม' : 'Roblox UserId (ตัวเลข)'}/>
        <button className="dz-btn pri" disabled={!man.value.trim()} onClick={async () => { await ban([{ type:man.type, value:man.value.trim() }], 'man'); setMan({ ...man, value:'' }); }}>แบน</button></div>
      {bans.length === 0 ? <div className="dz-empty"><Icon n="shield" size={26}/><b>ยังไม่มีรายการที่ถูกแบน</b></div>
      : <div className="rn-grid">{bans.map(b => <div className="dz-card rn-c" key={b.ip}><div className="rn-h"><div className="rn-n"><b className="bn-ip">{b.label && b.type !== 'ip' ? b.label : b.ip}</b><small>{b.reason || '—'}{b.by && ` · โดย ${b.by}`}</small></div><span className="rn-pill bn-pill">{TYPE[b.type || 'ip']}</span></div>
        <div className="rn-m"><span><Icon n="bolt" size={13}/>{b.exp ? 'หมดอายุ ' + new Date(b.exp).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' }) : 'ถาวร'}{b.auto && ' · ระบบแบนอัตโนมัติ'}</span></div>
        <div className="rn-f"><button onClick={() => unban(b.ip)}>ปลดบล็อก</button></div></div>)}</div>}</>}
  </div>);
}
