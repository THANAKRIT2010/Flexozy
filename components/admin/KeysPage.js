'use client';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { ago } from '../Ui';
import { api, send, useCopy, Panel, Stat, Pill, fmtDate } from './kit';
const stateOf = (k) => k.revoked ? ['bad', 'เพิกถอนแล้ว', 'revoked'] : (k.exp && Date.now() > k.exp) ? ['warn', 'หมดอายุ', 'expired'] : ['ok', 'ใช้งานได้', 'live'];
const FILTERS = [['all', 'ทั้งหมด'], ['live', 'ใช้งานได้'], ['expired', 'หมดอายุ'], ['revoked', 'เพิกถอน']];
export default function KeysPage(){
  const [keys, setKeys] = useState([]), [pics, setPics] = useState({}), [f, setF] = useState({ label:'', days:30, count:1, scope:'hub' }), [fresh, setFresh] = useState([]), [open, setOpen] = useState(null), [busy, setBusy] = useState(false), [q, setQ] = useState(''), [flt, setFlt] = useState('all'), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [cp, copy] = useCopy();
  const load = useCallback(async () => {
    const r = await api('/api/admin/keys'); if(!r.ok) return; setKeys(r.data);
    const ids = [...new Set(r.data.flatMap(k => [k.roblox_id, ...(k.profiles || []).map(p => p.id)]).filter(Boolean))];
    if(ids.length){ const t = await api('/api/admin/thumbs?kind=users&ids=' + ids.slice(0, 100).join(',')); if(t.ok && t.data) setPics(t.data); } // รูปโปรไฟล์ Roblox (ผ่านเซิร์ฟเวอร์ ไม่ติด CORS)
  }, []);
  useEffect(() => { load(); }, [load]);
  async function create(e){
    e.preventDefault(); setBusy(true); setErr('');
    const r = await send('/api/admin/keys', { label:f.label, days:Number(f.days), count:Number(f.count), scopes:f.scope.split(',').map(s => s.trim()).filter(Boolean) });
    setBusy(false); if(r.ok){ setFresh(r.data.keys); load(); } else setErr('สร้าง key ไม่สำเร็จ');
  }
  const act = async (kid, action) => { await send('/api/admin/keys/' + kid, { action }, 'PATCH'); load(); };
  const del = async (kid) => { if(!confirm('ลบ key นี้ถาวร?')) return; await api('/api/admin/keys/' + kid, { method:'DELETE' }); load(); };
  const delAll = async () => {
    if(!keys.length) return;
    if(!confirm(`ลบ key ทั้งหมด ${keys.length} รายการ พร้อมประวัติและ HWID ที่ผูกไว้?\nย้อนกลับไม่ได้ และผู้ใช้ทุกคนจะเข้าไม่ได้ทันที`)) return;
    if(prompt('พิมพ์ DELETE เพื่อยืนยันการลบทั้งหมด') !== 'DELETE') return;
    const r = await api('/api/admin/keys', { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ confirm:'DELETE' }) });
    if(r.ok){ setFresh([]); setOpen(null); setMsg(`ลบแล้ว ${r.data?.deleted ?? 0} key`); } else setMsg('ลบไม่สำเร็จ'); load();
  };
  const Avatar = ({ id, size = 34 }) => pics[id] ? <img src={pics[id]} alt="" width={size} height={size} style={{ borderRadius:'50%', objectFit:'cover', flex:'none', background:'#1b1f2b' }}/> : <span style={{ width:size, height:size, borderRadius:'50%', background:'#1b1f2b', flex:'none', display:'inline-block' }}/>;
  const rows = keys.filter(k => (flt === 'all' || stateOf(k)[2] === flt) && (k.label + k.hint + k.scopes.join(',') + (k.roblox_name || '') + (k.roblox_dn || '') + (k.roblox_id || '') + (k.hw_raw || '')).toLowerCase().includes(q.toLowerCase()));
  const n = (s) => keys.filter(k => stateOf(k)[2] === s).length;
  return (<div className="stack">
    <section className="ad-stats s4">
      <Stat label="Key ทั้งหมด" value={keys.length}/><Stat label="ใช้งานได้" value={n('live')} tone="ok"/>
      <Stat label="ผูกเครื่องแล้ว" value={keys.filter(k => k.bound).length}/><Stat label="เพิกถอน / หมดอายุ" value={n('revoked') + n('expired')}/>
    </section>
    <div className="ad-grid ad-g2">
      <div className="stack">
        <form className="pn" onSubmit={create}>
          <header className="pn-h"><div className="pn-t"><h2>สร้าง key ใหม่</h2></div></header>
          <label>ชื่อ/หมายเหตุ (เช่น ชื่อ Discord ของผู้ใช้)</label><input value={f.label} onChange={e => setF({ ...f, label:e.target.value })} maxLength={60}/>
          <div className="two"><div><label>อายุ (วัน, 0 = ไม่หมดอายุ)</label><input type="number" min="0" max="3650" value={f.days} onChange={e => setF({ ...f, days:e.target.value })}/></div>
            <div><label>จำนวน key</label><input type="number" min="1" max="50" value={f.count} onChange={e => setF({ ...f, count:e.target.value })}/></div></div>
          <label>สิทธิ์ (คั่นด้วย ,)</label><input value={f.scope} onChange={e => setF({ ...f, scope:e.target.value })}/>
          <small className="hint"><code>hub</code> เข้า Hub + ทุกแมพ · <code>*</code> ทั้งหมด · <code>login</code> แค่เข้า Hub · <code>v:โค้ดลิงก์</code> · <code>hub:ไอดีแมพ</code></small>
          <button className="btn w" disabled={busy}>{busy ? 'กำลังสร้าง...' : 'สร้าง key'}</button>{err && <div className="err">{err}</div>}
        </form>
        {fresh.length > 0 && <div className="res"><div className="f-h">✓ คัดลอกเก็บไว้เลย — ระบบแสดงเต็มครั้งเดียว</div>
          {fresh.map(k => <div className="row" key={k} style={{ marginBottom:6 }}><input readOnly value={k}/><button type="button" className="btn ghost" onClick={() => copy(k, k)}>{cp === k ? 'แล้ว ✓' : 'คัดลอก'}</button></div>)}
          <small className="hint">ผู้ใช้ใส่ key ครั้งเดียวในช่อง Enter Key ของ Hub — ระบบจำให้และเข้าอัตโนมัติครั้งต่อไป (หรือตั้งก่อนรัน: <code>getgenv().Key = "key ของเขา"</code>)</small>
          <button type="button" className="btn ghost sm" onClick={() => setFresh([])} style={{ marginTop:10 }}>ปิด</button></div>}
      </div>
      <Panel title="Key ทั้งหมด" sub={`${rows.length} จาก ${keys.length}`} actions={<><input className="search" placeholder="ค้นหาชื่อ / สิทธิ์ / Roblox / HWID" value={q} onChange={e => setQ(e.target.value)}/><button className="btn danger sm" disabled={!keys.length} onClick={delAll}>ลบ key ทั้งหมด</button></>}>
        {msg && <div className="res" style={{ marginBottom:10 }}><div className="f-h">{msg}</div></div>}
        <div className="seg">{FILTERS.map(([id, l]) => <button key={id} className={flt === id ? 'on' : ''} onClick={() => setFlt(id)}>{l}</button>)}</div>
        <div className="ad-tw"><table>
          <thead><tr><th>ผู้ใช้</th><th>สถานะ</th><th>สิทธิ์</th><th>หมดอายุ</th><th>เครื่อง (HWID)</th><th className="num">ใช้งาน</th><th>ล่าสุด</th><th style={{ textAlign:'right' }}>จัดการ</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="empty">{keys.length ? 'ไม่พบ key ที่ค้นหา' : 'ยังไม่มี key — สร้างได้จากฟอร์มด้านซ้าย'}</td></tr>}
            {rows.map(k => { const [c, t] = stateOf(k); return <Fragment key={k.kid}><tr>
              <td><div style={{ display:'flex', gap:10, alignItems:'center' }}>{k.roblox_id ? <Avatar id={k.roblox_id}/> : null}<div><div className="t">{k.label || '(ไม่มีชื่อ)'}</div>
                <div className="s">{k.hint}{k.runs > 0 && ` · รัน ${k.runs.toLocaleString()} ครั้ง`}</div>
                {k.roblox_id ? <div className="s"><a href={`https://www.roblox.com/users/${k.roblox_id}/profile`} target="_blank" rel="noreferrer">{k.roblox_dn ? `${k.roblox_dn} (@${k.roblox_name})` : `@${k.roblox_name || k.roblox_id}`}</a> · ID {k.roblox_id}</div> : <div className="s">ยังไม่มีโปรไฟล์ Roblox (ยังไม่เคยใช้)</div>}</div></div></td>
              <td><Pill tone={c}>{t}</Pill></td>
              <td><span className="s">{k.scopes.join(', ')}</span></td>
              <td>{k.exp ? new Date(k.exp).toLocaleDateString('th-TH') : 'ไม่หมดอายุ'}</td>
              <td><span className="tags">{k.bound ? (k.hw_raw ? <span title="คลิกเพื่อคัดลอก HWID เต็ม" style={{ cursor:'pointer' }} onClick={() => copy(k.hw_raw, 'hw' + k.kid)}><Pill tone="blue">{cp === 'hw' + k.kid ? 'คัดลอกแล้ว ✓' : k.hw_raw.length > 20 ? k.hw_raw.slice(0, 20) + '…' : k.hw_raw}</Pill></span> : <Pill tone="blue" >{k.hw} (รอเครื่องเข้าใช้ใหม่เพื่อแสดงค่าจริง)</Pill>) : <Pill>ยังไม่ผูก</Pill>}{k.denied > 0 && <Pill tone="bad">ปฏิเสธ {k.denied}</Pill>}</span></td>
              <td className="num">{k.uses}</td><td>{k.last_used > 0 ? ago(k.last_used) : '—'}</td>
              <td><div className="acts"><button className="btn ghost sm" onClick={() => setOpen(open === k.kid ? null : k.kid)}>ประวัติ</button>
                <button className="btn ghost sm" onClick={() => act(k.kid, k.revoked ? 'restore' : 'revoke')}>{k.revoked ? 'คืนสิทธิ์' : 'เพิกถอน'}</button>
                {k.bound && <button className="btn ghost sm" onClick={() => act(k.kid, 'reset_hwid')}>รีเซ็ต HWID</button>}
                <button className="btn danger sm" onClick={() => del(k.kid)}>ลบ</button></div></td></tr>
              {open === k.kid && <tr><td colSpan={8} className="sub">
                <div className="s" style={{ marginBottom:8 }}>HWID จริง: {k.hw_raw ? <><b>{k.hw_raw}</b>{k.hw_src && ` (จาก ${k.hw_src})`}</> : '—'}{k.last_ip && ` · IP ล่าสุด ${k.last_ip}`}</div>
                {(k.profiles || []).length > 0 && <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:10 }}>{k.profiles.map(p => <a key={p.id} href={`https://www.roblox.com/users/${p.id}/profile`} target="_blank" rel="noreferrer" style={{ display:'flex', gap:8, alignItems:'center' }}><Avatar id={p.id} size={30}/><span className="s">{p.dn ? `${p.dn} (@${p.name})` : `@${p.name || p.id}`}<br/>ID {p.id} · {ago(p.ts)}</span></a>)}</div>}
                {k.events.length === 0 ? <span className="dim">ไม่มีประวัติ</span> : k.events.map((e, i) => <div key={i} className="s">{fmtDate(e.ts)} · {e.t}{e.ip && ` · ${e.ip}`}{e.scope && ` · ${e.scope}`}</div>)}</td></tr>}</Fragment>; })}
          </tbody></table></div>
      </Panel>
    </div></div>);
}
