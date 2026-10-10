'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { api, send, Panel, Pill, Empty, Result } from './kit';
const empty = () => ({ id:'', name:'', placeIds:'', aliases:'', url:'' });
const toForm = (g) => ({ ...g, placeIds:(g.placeIds || []).join(', '), aliases:(g.aliases || []).join(', ') });
const toData = (g) => ({ ...g, placeIds:String(g.placeIds || '').split(/[\s,;]+/).filter(Boolean), aliases:String(g.aliases || '').split(',').map(x => x.trim()).filter(Boolean) });
const slug = (n) => String(n).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const firstId = (g) => String(g.placeIds || '').split(/[\s,;]+/).find(x => /^\d+$/.test(x) && Number(x) > 0);
function Icon({ g, thumbs, size }){ const u = thumbs[firstId(g)]; return <div className="ad-ico" style={size ? { width:size, height:size } : undefined}>{u ? <img src={u} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }}/> : (g.name || '?').slice(0, 1).toUpperCase()}</div>; }
const BY = { id:'จับคู่ด้วย Place/Universe ID', name:'จับคู่ด้วยชื่อ', default:'ไม่ตรงแมพใด — ใช้ ALL MENU' };

export default function MapsPage(){
  const [games, setGames] = useState([]), [edit, setEdit] = useState(null), [form, setForm] = useState(empty()), [query, setQuery] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [custom, setCustom] = useState(false), [thumbs, setThumbs] = useState({}), [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState('all'), [sel, setSel] = useState(null), [health, setHealth] = useState({}), [sim, setSim] = useState({ placeId:'', name:'' }), [simRes, setSimRes] = useState(null), [batch, setBatch] = useState(null);
  const flash = (t, bad = false) => setMsg({ t, bad });
  const load = useCallback(async () => {
    setBusy(true); const r = await api('/api/admin/games');
    if(r.ok){ setGames((r.data.games || []).map(toForm)); setCustom(!!r.data.custom); setDirty(false); } else flash(r.data?.error || 'โหลดข้อมูลไม่สำเร็จ', true);
    setBusy(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  // ไอคอนจริงจาก Roblox (ผ่านเซิร์ฟเวอร์เพราะเบราว์เซอร์ติด CORS) — ขอเฉพาะ id ที่ยังไม่มี
  useEffect(() => {
    const need = [...new Set(games.map(firstId).filter(i => i && !(i in thumbs)))]; if(!need.length) return; let off = false;
    api('/api/admin/thumbs?ids=' + need.join(',')).then(r => { if(!off) setThumbs(p => ({ ...p, ...(r.ok ? r.data : Object.fromEntries(need.map(i => [i, '']))) })); });
    return () => { off = true; };
  }, [games, thumbs]);

  const filtered = useMemo(() => games.map((g, i) => ({ g, i })).filter(({ g }) => (g.name + ' ' + g.id + ' ' + g.placeIds + ' ' + g.aliases).toLowerCase().includes(query.toLowerCase())), [games, query]);
  const selGame = games.find(g => g.id === sel) || null;
  const up = (k, v) => setForm(p => ({ ...p, [k]:v }));
  const startNew = () => { setEdit(-1); setForm(empty()); };
  const startEdit = (i) => { setEdit(i); setForm({ ...games[i] }); };
  function saveLocal(){
    const name = form.name.trim(); if(!name) return flash('กรุณากรอกชื่อแมพ', true);
    const url = form.url.trim(); if(url && !/^https:\/\//i.test(url)) return flash('URL ต้องขึ้นต้นด้วย https://', true);
    const id = slug(form.id.trim() || name) || 'map-' + Math.random().toString(36).slice(2, 7);
    if(games.some((g, i) => g.id === id && i !== edit)) return flash(`Map Key “${id}” ซ้ำกับแมพอื่น — เปลี่ยนรหัสภายใน`, true);
    const next = { ...form, id, name, url };
    setGames(p => edit === -1 ? [...p, next] : p.map((g, i) => i === edit ? next : g)); setEdit(null); setDirty(true);
    flash('แก้ไขในแบบร่างแล้ว — กด “บันทึกทั้งหมด” เพื่อใช้งานจริง');
  }
  function remove(i){ if(!confirm(`ลบแมพ “${games[i].name}” ?`)) return; setGames(p => p.filter((_, n) => n !== i)); setDirty(true); flash('ลบออกจากแบบร่างแล้ว — กด “บันทึกทั้งหมด” เพื่อยืนยัน'); }
  async function publish(){
    setBusy(true); setMsg(null); const r = await send('/api/admin/games', { games:games.map(toData) }, 'PUT');
    if(r.ok){ setGames((r.data.games || []).map(toForm)); setCustom(true); setDirty(false); setHealth({}); flash('บันทึกแล้ว — Hub ใช้รายการนี้ทันทีในการรันครั้งถัดไป'); } else flash(r.data?.error || 'บันทึกไม่สำเร็จ', true);
    setBusy(false);
  }
  async function reset(){ if(!confirm('คืนค่ารายการแมพเริ่มต้นของโปรเจกต์?')) return; setBusy(true); const r = await api('/api/admin/games', { method:'DELETE' }); if(r.ok){ await load(); setHealth({}); flash('คืนค่ารายการเริ่มต้นแล้ว'); } else flash('คืนค่าไม่สำเร็จ', true); setBusy(false); }

  // ===== ทดสอบจริง (ยิงเซิร์ฟเวอร์ ใช้ค่าที่ "บันทึกแล้ว") =====
  const testScript = useCallback(async (id) => {
    setHealth(h => ({ ...h, [id]:{ pending:true } }));
    const r = await send('/api/admin/test', { action:'script', id });
    setHealth(h => ({ ...h, [id]:r.ok ? r.data : { ok:false, error:'เรียกเซิร์ฟเวอร์ไม่สำเร็จ' } }));
  }, []);
  async function testAll(){
    const ids = games.filter(g => g.url).map(g => g.id); let done = 0; setBatch({ done:0, total:ids.length });
    const queue = [...ids]; await Promise.all([0, 1, 2].map(async () => { while(queue.length){ await testScript(queue.shift()); setBatch({ done:++done, total:ids.length }); } }));
    setBatch(null);
  }
  async function simulate(){
    setSimRes({ pending:true }); const r = await send('/api/admin/test', { action:'resolve', placeId:sim.placeId, name:sim.name });
    setSimRes(r.ok ? r.data : { error:true });
  }
  const pick = (g) => { setSel(g.id); setSim({ placeId:firstId(g) || '', name:g.name }); setSimRes(null); };
  const shown = (tab === 'rec' ? games.filter(g => g.url).slice(0, 4) : games).filter(g => !query || (g.name + g.id).toLowerCase().includes(query.toLowerCase()));
  const okN = Object.values(health).filter(h => h.ok).length, badN = Object.values(health).filter(h => h.ok === false).length;
  const badge = (g) => { const h = health[g.id]; if(!g.url) return <Pill tone="bad">ไม่มี URL</Pill>; if(h?.pending) return <Pill>กำลังทดสอบ…</Pill>; if(!h) return <Pill>ยังไม่ทดสอบ</Pill>; return h.ok ? <Pill tone="ok">พร้อมรัน</Pill> : <Pill tone="bad">ผิดพลาด</Pill>; };

  return (<div className="ad-grid ad-g3">
    <Panel title="รายการแมพ" sub={`${games.length} แมพ${dirty ? ' · มีการแก้ไขที่ยังไม่บันทึก' : ''}`}
      actions={<><input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาชื่อ / ID / Place ID"/><button className="btn ghost" onClick={startNew}>＋ เพิ่มแมพ</button><button className="btn" disabled={busy || !dirty} onClick={publish}>{busy ? 'กำลังบันทึก…' : 'บันทึกทั้งหมด'}</button></>}>
      {msg && <div className={'note' + (msg.bad ? ' bad' : '')} role="status">{msg.t}</div>}
      {edit !== null && <div className="ad-edit"><header className="pn-h"><div className="pn-t"><h2>{edit === -1 ? 'เพิ่มแมพใหม่' : 'แก้ไขแมพ'}</h2></div><span className="grow"/><button className="btn ghost sm" onClick={() => setEdit(null)}>ปิด</button></header>
        <div className="ad-fields">
          <div><label>ชื่อแมพ — ใช้จับคู่และรันด้วยชื่อได้</label><input value={form.name} onChange={e => up('name', e.target.value)} placeholder="เช่น Murder Mystery 2"/></div>
          <div><label>Map Key (รหัสภายใน)</label><input value={form.id} onChange={e => up('id', e.target.value)} placeholder="เช่น mm2 — เว้นว่างเพื่อสร้างจากชื่อ"/><small>a-z 0-9 และ - เท่านั้น ห้ามซ้ำกัน</small></div>
          <div><label>Place ID / Universe ID</label><input value={form.placeIds} onChange={e => up('placeIds', e.target.value)} placeholder="142823291, 123456789"/><small>ใส่ได้หลายค่า คั่นด้วย ,</small></div>
          <div><label>ชื่ออื่นสำหรับจับคู่ (alias)</label><input value={form.aliases} onChange={e => up('aliases', e.target.value)} placeholder="MM2, Murder Mystery"/><small>ใช้เมื่อ Place ID ไม่ตรง และตอนพิมพ์ใน Run by Map Name</small></div>
          <div className="full"><label>Script URL</label><input value={form.url} onChange={e => up('url', e.target.value)} placeholder="https://raw.githubusercontent.com/..."/><small>HTTPS โดเมนสาธารณะเท่านั้น — ผู้ใช้ไม่เห็น URL นี้ เซิร์ฟเวอร์ดึงให้</small></div></div>
        <div className="row end"><button className="btn" onClick={saveLocal}>ใช้ข้อมูลนี้</button></div></div>}
      <div className="ad-maps">
        {filtered.map(({ g, i }) => <article className={'ad-map' + (sel === g.id ? ' on' : '')} key={g.id + '-' + i}><Icon g={g} thumbs={thumbs}/>
          <div className="mi"><b>{g.name}</b><small>{g.id} · {g.placeIds || 'จับคู่ด้วยชื่อ'}</small></div>
          {badge(g)}<button className="btn ghost sm" onClick={() => pick(g)}>ทดสอบ</button><button className="btn ghost sm" onClick={() => startEdit(i)}>แก้ไข</button><button className="btn danger sm" onClick={() => remove(i)}>ลบ</button></article>)}
        {!filtered.length && <Empty>ไม่พบแมพที่ค้นหา</Empty>}</div>
      <footer className="pn-f"><small>{custom ? 'กำลังใช้รายการที่บันทึกไว้' : 'กำลังใช้รายการเริ่มต้นของโปรเจกต์'}</small><button className="btn ghost sm" disabled={busy} onClick={reset}>คืนค่าเริ่มต้น</button></footer>
    </Panel>

    <aside className="stack sticky">
      <section className="prev">
        <header><i/>Hub ในเกม · ข้อมูลจริง<span className="grow"/><small>{games.length} แมพ</small></header>
        <div className="mock"><div className="mock-side"><div className="lg"><img src="/images/flexozy-logo.png" alt=""/><div><b>Flexozy</b><small>SCRIPT HUB</small></div></div>
          <button className={tab === 'rec' ? 'on' : ''} onClick={() => setTab('rec')}>Recommend</button><button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All Scripts</button></div>
          <div className="mock-main"><h4>{tab === 'rec' ? 'Recommend' : 'All Scripts'}</h4><p>คลิกการ์ดเพื่อเลือกแมพแล้วทดสอบด้านล่าง</p>
            <div className="mock-cards">{shown.map(g => <button key={g.id} className={'mock-card' + (sel === g.id ? ' on' : '')} onClick={() => pick(g)}><Icon g={g} thumbs={thumbs} size={34}/><div><b>{g.name}</b><small>{!g.url ? 'ยังไม่มี URL' : health[g.id]?.ok ? 'ผ่านการทดสอบ' : health[g.id]?.ok === false ? 'ทดสอบไม่ผ่าน' : 'ยังไม่ทดสอบ'}</small></div></button>)}
              {!shown.length && <Empty>ยังไม่มีแมพ</Empty>}</div></div></div>
      </section>
      <Panel title={selGame ? `ทดสอบ · ${selGame.name}` : 'ทดสอบการรัน'} sub={dirty ? 'มีแบบร่างที่ยังไม่บันทึก — ผลทดสอบใช้ค่าที่บันทึกแล้ว' : 'ทดสอบกับเซิร์ฟเวอร์จริง'}
        actions={<button className="btn ghost sm" disabled={!!batch || !games.some(g => g.url)} onClick={testAll}>{batch ? `กำลังทดสอบ ${batch.done}/${batch.total}` : 'ทดสอบทุกแมพ'}</button>}>
        {(okN + badN > 0) && <div className="sumline"><Pill tone="ok">ผ่าน {okN}</Pill>{badN > 0 && <Pill tone="bad">ไม่ผ่าน {badN}</Pill>}</div>}
        {!selGame ? <Empty>เลือกแมพจากรายการหรือการ์ดด้านบน</Empty> : <div className="stack tight">
          <div><div className="lab">1 · เซิร์ฟเวอร์ดึง Script URL ได้จริงไหม</div>
            <button className="btn sm" disabled={!selGame.url || health[selGame.id]?.pending} onClick={() => testScript(selGame.id)}>{health[selGame.id]?.pending ? 'กำลังดึง…' : 'ทดสอบ Script URL'}</button>
            {health[selGame.id] && !health[selGame.id].pending && <Result ok={health[selGame.id].ok} label={health[selGame.id].ok ? 'ดึงสคริปต์สำเร็จ' : 'ดึงสคริปต์ไม่สำเร็จ'} detail={health[selGame.id].ok ? `${(health[selGame.id].bytes / 1024).toFixed(1)} KB · ${health[selGame.id].ms} ms` : health[selGame.id].error}/>}</div>
          <div><div className="lab">2 · จำลอง Hub ตรวจแมพตอนผู้เล่นเข้าเกม</div>
            <div className="two"><input value={sim.placeId} onChange={e => setSim(s => ({ ...s, placeId:e.target.value }))} placeholder="Place ID"/><input value={sim.name} onChange={e => setSim(s => ({ ...s, name:e.target.value }))} placeholder="ชื่อเกม"/></div>
            <button className="btn sm" style={{ marginTop:8 }} disabled={simRes?.pending} onClick={simulate}>จำลอง</button>
            {simRes && !simRes.pending && (simRes.error ? <Result ok={false} label="เรียกเซิร์ฟเวอร์ไม่สำเร็จ"/> : <Result ok={simRes.id === selGame.id} label={`Hub จะรัน “${simRes.name}”`} detail={`${BY[simRes.by]}${simRes.id === selGame.id ? '' : ` — ไม่ใช่แมพที่เลือก (${selGame.name})`}`}/>)}</div>
        </div>}
      </Panel>
    </aside>
  </div>);
}
