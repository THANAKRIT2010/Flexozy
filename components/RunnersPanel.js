'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
import { Avatar } from '@/components/Ui';
import { ago } from '@/components/Ui';
// โปรไฟล์ Roblox ที่รัน Loader (มาจาก key ที่ใช้งาน) — แอดมินดูได้จากแดชบอร์ดเลย ไม่ต้องเข้าเมนูหลังบ้านก่อน
export default function RunnersPanel(){
  const [rows, setRows] = useState(null), [pics, setPics] = useState({}), [q, setQ] = useState(''), [busy, setBusy] = useState(false), [cp, setCp] = useState('');
  const load = useCallback(async () => { setBusy(true);
    try{ const r = await fetch('/api/admin/keys', { cache:'no-store' }); if(!r.ok) return setRows([]); const keys = await r.json(), m = new Map();
      for(const k of keys) for(const p of (k.profiles?.length ? k.profiles : (k.roblox_id ? [{ id:k.roblox_id, name:k.roblox_name, dn:k.roblox_dn, ts:k.last_used || k.created_at }] : []))){
        const o = m.get(p.id); if(!o || p.ts > o.ts) m.set(p.id, { id:p.id, name:p.name, dn:p.dn, ts:p.ts || 0, key:k.label || '(ไม่มีชื่อ)', hw:k.hw_raw || k.hw || '', runs:k.runs || 0, revoked:!!k.revoked }); }
      const list = [...m.values()].sort((a, b) => b.ts - a.ts); setRows(list);
      const ids = list.map(x => x.id).slice(0, 100); if(ids.length){ const t = await fetch('/api/admin/thumbs?kind=users&ids=' + ids.join(',')).then(x => x.json()).catch(() => null); if(t?.data || t) setPics(t.data || t); } }
    catch{ setRows([]); } setBusy(false); }, []);
  useEffect(() => { load(); }, [load]);
  const f = useMemo(() => (rows || []).filter(x => !q || `${x.name} ${x.dn} ${x.id} ${x.key} ${x.hw}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const now = Date.now(), live = (rows || []).filter(x => now - x.ts < 720000).length, day = (rows || []).filter(x => now - x.ts < 86400000).length;
  const copy = (t, k) => { navigator.clipboard.writeText(String(t)); setCp(k); setTimeout(() => setCp(''), 1100); };
  return (<div className="rn">
    <div className="rn-top"><div className="rn-st"><b>{(rows || []).length}</b><span>โปรไฟล์ทั้งหมด</span></div><div className="rn-st on"><b>{live}</b><span>ออนไลน์ตอนนี้</span></div><div className="rn-st"><b>{day}</b><span>รันใน 24 ชม.</span></div>
      <span className="grow"/><div className="dz-find"><Icon n="eye" size={15}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อ / ID / key / HWID"/></div><button className="dz-btn" onClick={load} disabled={busy}>{busy ? 'กำลังโหลด…' : 'รีเฟรช'}</button></div>
    {rows === null ? <div className="rn-grid">{[0, 1, 2, 3, 4, 5].map(i => <div className="sk" style={{ height:150, borderRadius:18 }} key={i}/>)}</div>
    : f.length === 0 ? <div className="dz-empty"><Icon n="users" size={26}/><b>ยังไม่มีโปรไฟล์ที่รัน Loader</b><span>จะขึ้นเมื่อมีคนรัน Hub ด้วย key ในเกม</span></div>
    : <div className="rn-grid">{f.map(x => { const on = now - x.ts < 720000; return (<div className="dz-card rn-c" key={x.id}>
        <div className="rn-h"><span className={'rn-av' + (on ? ' on' : '')}><Avatar src={pics[x.id]} name={x.dn || x.name} size={52}/></span>
          <div className="rn-n"><a href={`https://www.roblox.com/users/${x.id}/profile`} target="_blank" rel="noreferrer">{x.dn || x.name || x.id}</a><small>@{x.name || '—'}</small></div><span className={'rn-pill' + (on ? ' on' : '')}>{on ? 'กำลังเล่น' : ago(x.ts)}</span></div>
        <div className="rn-m"><span><Icon n="key" size={13}/>{x.key}{x.revoked && ' · เพิกถอน'}</span><span><Icon n="play" size={13}/>{x.runs.toLocaleString()} รัน</span></div>
        <div className="rn-f"><button onClick={() => copy(x.id, 'i' + x.id)}>{cp === 'i' + x.id ? 'คัดลอกแล้ว ✓' : <>ID {x.id}</>}</button>{x.hw && <button onClick={() => copy(x.hw, 'h' + x.id)} title="คัดลอก HWID">{cp === 'h' + x.id ? 'คัดลอกแล้ว ✓' : 'HWID'}</button>}</div></div>); })}</div>}
  </div>);
}
