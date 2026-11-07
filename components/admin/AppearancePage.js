'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icons';
import CountUp from '../CountUp';
import { THEMES, SOURCES, ICON_IDS, themeVars, statValue } from '@/lib/siteTheme';
import { api, send, Panel, Empty } from './kit';
// หน้า "ธีมและสถิติ": เลือกโทนสี · แก้ข้อความหน้าแรก · เพิ่ม/ลบ/แก้ช่องสถิติ — พรีวิวสดทางขวา (ยังไม่บันทึกก็เห็นผล)
const MAX = 8, eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rgbStr = (v) => v['--main-rgb'];
export default function AppearancePage(){
  const [cfg, setCfg] = useState(null), [saved, setSaved] = useState(null), [raw, setRaw] = useState({}), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false), [replay, setReplay] = useState(0);
  const savedVars = useRef(null);
  useEffect(() => { (async () => {
    const r = await api('/api/admin/site');
    if(r.ok){ setCfg(r.data.cfg); setSaved(r.data.cfg); setRaw(r.data.raw || {}); savedVars.current = r.data.vars; }
    else setMsg({ bad:true, t:'โหลดการตั้งค่าไม่สำเร็จ' });
  })(); }, []);
  const vars = useMemo(() => cfg ? themeVars(cfg) : null, [cfg]);
  // ใช้สีที่เลือกกับทั้งหลังบ้านทันที (พรีวิว) — ออกจากหน้านี้โดยไม่บันทึกจะคืนค่าเดิม
  useEffect(() => { if(!vars) return; const el = document.documentElement.style; for(const k in vars) el.setProperty(k, vars[k]); }, [vars]);
  useEffect(() => () => { const v = savedVars.current; if(!v) return; const el = document.documentElement.style; for(const k in v) el.setProperty(k, v[k]); }, []);
  if(!cfg) return <Empty>{msg?.t || 'กำลังโหลด…'}</Empty>;
  const dirty = !eq(cfg, saved), set = (p) => { setCfg(c => ({ ...c, ...p })); setMsg(null); };
  const setStat = (i, p) => set({ stats:cfg.stats.map((s, n) => n === i ? { ...s, ...p } : s) });
  const move = (i, d) => { const a = [...cfg.stats], j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set({ stats:a }); };
  const del = (i) => set({ stats:cfg.stats.filter((_, n) => n !== i) });
  const add = () => set({ stats:[...cfg.stats, { id:'s' + Date.now().toString(36).slice(-6), label:'สถิติใหม่', unit:'', icon:'star', source:'manual', value:0, offset:0, show:true }] });
  async function save(){
    setBusy(true); setMsg(null); const r = await send('/api/admin/site', cfg, 'PUT'); setBusy(false);
    if(!r.ok) return setMsg({ bad:true, t:r.data?.error || 'บันทึกไม่สำเร็จ' });
    setCfg(r.data.cfg); setSaved(r.data.cfg); setRaw(r.data.raw || {}); savedVars.current = r.data.vars; setMsg({ t:'บันทึกแล้ว — หน้าแรกอัปเดตทันที' });
  }
  async function reset(){
    if(!confirm('คืนค่าเริ่มต้นทั้งหมด (ธีม ข้อความ และช่องสถิติ)?')) return;
    setBusy(true); const r = await api('/api/admin/site', { method:'DELETE' }); setBusy(false);
    if(r.ok){ setCfg(r.data.cfg); setSaved(r.data.cfg); setRaw(r.data.raw || {}); savedVars.current = r.data.vars; setMsg({ t:'คืนค่าเริ่มต้นแล้ว' }); }
  }
  const pv = { '--pm':rgbStr(vars), '--ps':vars['--main-soft'], '--pc':vars['--main'], '--pa':vars['--main-alt'], '--po':vars['--on-main'] };
  const shown = cfg.stats.filter(s => s.show);
  return (<div className="stack">
    <div className="ap">
      <div className="ap-col">
        <Panel title="โทนสี" sub="ใช้กับหน้าแรกและหลังบ้านพร้อมกัน">
          <div className="ap-themes">
            {Object.entries(THEMES).map(([id, t]) => <button type="button" key={id} className={'ap-th' + (cfg.theme === id ? ' on' : '')} onClick={() => set({ theme:id })}>
              <i className="ap-sw" style={{ background:`linear-gradient(135deg,${t.main},${t.alt})` }}/>{t.name}</button>)}
            <button type="button" className={'ap-th' + (cfg.theme === 'custom' ? ' on' : '')} onClick={() => set({ theme:'custom' })}>
              <i className="ap-sw" style={{ background:`conic-gradient(from 90deg,#f43f5e,#f59e0b,#10b981,#0ea5e9,#7c5cff,#f43f5e)` }}/>กำหนดเอง</button>
          </div>
          {cfg.theme === 'custom' && <div className="ap-custom">
            <input type="color" value={cfg.accent} onChange={e => set({ accent:e.target.value })} aria-label="เลือกสี"/>
            <input type="text" value={cfg.accent} maxLength={7} onChange={e => { const v = e.target.value; setCfg(c => ({ ...c, accent:v })); setMsg(null); }} placeholder="#7c5cff"/>
            <small className="dim">ระบบสร้างสีอ่อนและสีคู่ให้อัตโนมัติ{/^#[0-9a-f]{6}$/i.test(cfg.accent) ? '' : ' · รูปแบบต้องเป็น #rrggbb'}</small>
          </div>}
        </Panel>

        <Panel title="ข้อความหน้าแรก">
          <label>ป้ายเล็กเหนือชื่อ (เว้นว่าง = ไม่แสดง)</label><input value={cfg.hero.badge} maxLength={40} onChange={e => set({ hero:{ ...cfg.hero, badge:e.target.value } })} placeholder="เช่น Script Hub"/>
          <label>ชื่อใหญ่</label><input value={cfg.hero.title} maxLength={40} onChange={e => set({ hero:{ ...cfg.hero, title:e.target.value } })}/>
          <label>คำอธิบาย</label><textarea style={{ minHeight:84, fontFamily:'inherit' }} value={cfg.hero.tagline} maxLength={200} onChange={e => set({ hero:{ ...cfg.hero, tagline:e.target.value } })}/>
        </Panel>

        <Panel title="ช่องแสดงสถิติ" sub={`${cfg.stats.length} / ${MAX} ช่อง · ตัวเลขนับขึ้นจาก 0 เมื่อผู้เข้าเว็บเลื่อนมาเห็น`}
          actions={<button type="button" className="btn sm" onClick={add} disabled={cfg.stats.length >= MAX}><Icon n="plus" size={15}/>เพิ่มช่อง</button>}>
          <label className="chk"><input type="checkbox" checked={cfg.showStats} onChange={e => set({ showStats:e.target.checked })}/>แสดงช่องสถิติบนหน้าแรก</label>
          <label>ความเร็วการนับเลข · {(cfg.countMs / 1000).toFixed(1)} วินาที</label>
          <input type="range" min="600" max="6000" step="200" value={cfg.countMs} onChange={e => set({ countMs:Number(e.target.value) })} style={{ padding:0, accentColor:'var(--main)' }}/>
          <div className="ap-rows" style={{ marginTop:16 }}>
            {cfg.stats.length === 0 && <Empty>ยังไม่มีช่องสถิติ — กด “เพิ่มช่อง”</Empty>}
            {cfg.stats.map((s, i) => { const auto = s.source !== 'manual', val = statValue(s, raw);
              return (<div className={'ap-row' + (s.show ? '' : ' off')} key={s.id}>
                <div className="ap-ic"><Icon n={s.icon} size={20}/></div>
                <div className="ap-f">
                  <div className="w2"><label>ชื่อ</label><input value={s.label} maxLength={40} onChange={e => setStat(i, { label:e.target.value })}/></div>
                  <div><label>หน่วย</label><input value={s.unit} maxLength={16} onChange={e => setStat(i, { unit:e.target.value })} placeholder="เช่น คน"/></div>
                  <div><label>ที่มา</label><select value={s.source} onChange={e => setStat(i, { source:e.target.value })}>{Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  {auto ? <div className="w2"><label>ค่าจริงจากระบบ</label><input readOnly value={(raw[s.source] ?? 0).toLocaleString('th-TH')}/></div>
                    : <div className="w2"><label>ตัวเลขที่กำหนดเอง</label><input type="number" min="0" value={s.value} onChange={e => setStat(i, { value:e.target.value === '' ? 0 : Number(e.target.value) })}/></div>}
                  <div><label>บวก/ลบเพิ่ม</label><input type="number" value={s.offset} onChange={e => setStat(i, { offset:e.target.value === '' ? 0 : Number(e.target.value) })}/></div>
                  <div><label>ผู้ใช้เห็น</label><input readOnly value={val.toLocaleString('th-TH')}/></div>
                  <div className="w4"><label>ไอคอน</label><div className="ap-icons">{ICON_IDS.map(n => <button type="button" key={n} className={'ap-ib' + (s.icon === n ? ' on' : '')} onClick={() => setStat(i, { icon:n })} aria-label={n}><Icon n={n} size={17}/></button>)}</div></div>
                </div>
                <div className="ap-act">
                  <button type="button" className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น"><Icon n="up" size={15}/></button>
                  <button type="button" className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === cfg.stats.length - 1} aria-label="เลื่อนลง"><Icon n="down" size={15}/></button>
                  <button type="button" className={'btn ghost sm'} onClick={() => setStat(i, { show:!s.show })} aria-label="แสดง/ซ่อน" title={s.show ? 'ซ่อนช่องนี้' : 'แสดงช่องนี้'}><Icon n="eye" size={15}/></button>
                  <button type="button" className="btn danger sm" onClick={() => del(i)} aria-label="ลบ"><Icon n="trash" size={15}/></button>
                </div>
              </div>); })}
          </div>
          <p className="ap-note">“บวก/ลบเพิ่ม” ใช้ปรับตัวเลขที่มาจากระบบ เช่น ใส่ +1000 เพื่อรวมยอดเดิมก่อนย้ายระบบ · ค่าที่ผู้ใช้เห็นจะไม่ติดลบ</p>
        </Panel>
      </div>

      <div className="ap-col">
        <aside className="apv" style={pv}>
          <header><i/>พรีวิวหน้าแรก (อัปเดตสด)<span className="grow"/><button type="button" className="btn ghost sm" onClick={() => setReplay(x => x + 1)}>เล่นการนับอีกครั้ง</button></header>
          <div className="apv-body">
            {cfg.hero.badge && <span className="apv-badge">{cfg.hero.badge}</span>}
            <h3 className="apv-t">{cfg.hero.title}</h3>
            <p className="apv-p">{cfg.hero.tagline}</p>
            <span className="apv-btn">สร้างลิงก์ใหม่ →</span>
            {cfg.showStats && shown.length > 0 && <div className="apv-stats">{shown.map(s => <div className="apv-s" key={s.id}>
              <i><Icon n={s.icon} size={15}/></i><div><small>{s.label}</small><b><CountUp key={replay + s.id + statValue(s, raw)} to={statValue(s, raw)} ms={cfg.countMs}/>{s.unit && <em>{s.unit}</em>}</b></div></div>)}</div>}
            {cfg.showStats && shown.length === 0 && <p className="apv-p" style={{ marginTop:18 }}>ไม่มีช่องที่แสดง</p>}
            {!cfg.showStats && <p className="apv-p" style={{ marginTop:18 }}>ซ่อนช่องสถิติอยู่</p>}
          </div>
        </aside>
      </div>
    </div>

    <div className="ap-bar">
      <button type="button" className="btn" onClick={save} disabled={busy || !dirty}>{busy ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}</button>
      <button type="button" className="btn ghost" onClick={() => { setCfg(saved); setMsg(null); }} disabled={busy || !dirty}>ยกเลิกการแก้ไข</button>
      <button type="button" className="btn danger" onClick={reset} disabled={busy}>คืนค่าเริ่มต้น</button>
      <span className="grow"/>
      {msg ? <span className={msg.bad ? 'msgbad' : 'msgok'}>{msg.t}</span> : dirty ? <span className="dim">มีการแก้ไขที่ยังไม่บันทึก</span> : <span className="dim">ตรงกับที่ใช้งานอยู่</span>}
    </div>
  </div>);
}
