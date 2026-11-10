'use client';
import { useEffect, useState } from 'react';
import { failover, ls } from '@/lib/snippets';
import { api, send, useCopy, Panel, Pill, Empty, Result, fmtDate } from './kit';
const EV = { admin_ban:['bad', 'แอดมินแบน IP'], admin_unban:['ok', 'แอดมินปลดบล็อก IP'], auto_ban:['bad', 'ระบบแบนอัตโนมัติ'], dump_suspect:['bad', 'สงสัยว่า dump loader'], token_ip_mismatch:['warn', 'token ถูกใช้จาก IP อื่น'], token_replay:['warn', 'ใช้ token ซ้ำ'] };

// ===== เครื่องมือทดสอบระบบกัน dump — ยิงของจริงทั้งหมด =====
function Lab(){
  const [ld, setLd] = useState(null), [flow, setFlow] = useState(null), [kc, setKc] = useState({ key:'', scope:'login' }), [kr, setKr] = useState(null), [busy, setBusy] = useState('');
  const run = async (name, body, set) => { setBusy(name); set({ pending:true }); const r = await send('/api/admin/test', body); set(r.ok ? r.data : { error:r.data?.error || 'เรียกเซิร์ฟเวอร์ไม่สำเร็จ' }); setBusy(''); };
  return (<div className="lab-grid">
    <div className="lab-c"><h3>1 · คนที่ dump /loader เห็นอะไร</h3>
      <p>สร้าง /loader จริงแล้วตรวจว่าไม่มีโดเมน/token รั่ว และถอดรหัสกลับได้ครบ</p>
      <button className="btn sm" disabled={!!busy} onClick={() => run('ld', { action:'loader' }, setLd)}>{busy === 'ld' ? 'กำลังสร้าง…' : 'ทดสอบ'}</button>
      {ld && !ld.pending && (ld.error ? <Result ok={false} label={ld.error}/> : <>
        <Result ok={ld.sealed} label={ld.sealed ? 'ซีลเปิดอยู่' : 'ซีลปิดอยู่ (ANTI_DUMP_SEAL=0)'} detail={`ขนาดที่ส่ง ${ld.bytes.toLocaleString()} ไบต์`}/>
        <Result ok={ld.leaks.length === 0} label={ld.leaks.length ? 'พบข้อมูลรั่วใน response' : 'ไม่พบโดเมน / token / ชื่อ endpoint ในข้อความที่ dump ได้'} detail={ld.leaks.length ? ld.leaks.join(', ') : ''}/>
        {ld.roundtrip !== null && <Result ok={ld.roundtrip} label={ld.roundtrip ? 'ถอดรหัสกลับได้ตรงต้นฉบับ (ผู้ใช้จริงรันได้ปกติ)' : 'ถอดรหัสกลับไม่ตรง!'} detail={`ขนาดจริงหลังถอด ${ld.innerBytes.toLocaleString()} ไบต์`}/>}
        <div className="lab">ตัวอย่างสิ่งที่ print(HttpGet) แสดง (ส่วนหลัง guard)</div><pre className="snip dumpv">{ld.view}</pre></>)}</div>
    <div className="lab-c"><h3>2 · เส้นทางจริงทั้งหมด</h3>
      <p>ยิง HTTP เข้า API ของคุณเองด้วย executor / token ซ้ำ / เบราว์เซอร์ / บอท แล้วเช็กผล</p>
      <button className="btn sm" disabled={!!busy} onClick={() => run('flow', { action:'flow' }, setFlow)}>{busy === 'flow' ? 'กำลังทดสอบ…' : 'เริ่มทดสอบ'}</button>
      {flow && !flow.pending && (flow.error ? <Result ok={false} label={flow.error}/> : <><div className="sumline"><Pill tone={flow.ok ? 'ok' : 'bad'}>{flow.ok ? 'ผ่านทุกข้อ' : 'มีข้อที่ไม่ผ่าน'}</Pill><small className="dim">{flow.base}</small></div>
        {flow.steps.map(s => <Result key={s.id} ok={s.ok} label={s.label} detail={s.detail}/>)}</>)}</div>
    <div className="lab-c"><h3>3 · ตรวจสถานะ key</h3>
      <p>อ่านอย่างเดียว — ไม่ผูก HWID และไม่นับการใช้งาน</p>
      <input value={kc.key} onChange={e => setKc({ ...kc, key:e.target.value })} placeholder="FX-XXXX-XXXX-XXXX-XXXX" spellCheck={false}/>
      <div className="two" style={{ marginTop:8 }}><input value={kc.scope} onChange={e => setKc({ ...kc, scope:e.target.value })} placeholder="scope เช่น login / hub:mm2"/>
        <button className="btn sm" disabled={!!busy || !kc.key} onClick={() => run('key', { action:'key', ...kc }, setKr)}>ตรวจ</button></div>
      {kr && !kr.pending && (kr.error ? <Result ok={false} label={kr.error}/> : !kr.ok ? <Result ok={false} label={kr.error}/> : <>
        <Result ok={kr.usable} label={kr.usable ? `ใช้ได้กับ scope “${kr.scope}”` : kr.revoked ? 'ถูกเพิกถอน' : kr.expired ? 'หมดอายุ' : `ไม่มีสิทธิ์ใน scope “${kr.scope}”`} detail={`${kr.label || '(ไม่มีชื่อ)'} · สิทธิ์ ${kr.scopes.join(', ')}`}/>
        <Result ok={true} label={kr.bound ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูกเครื่อง'} detail={`ใช้ ${kr.uses} ครั้ง · ปฏิเสธ ${kr.denied} ครั้ง${kr.exp ? ' · หมดอายุ ' + fmtDate(kr.exp) : ''}`}/></>)}</div>
  </div>);
}

// ===== แบน / ปลดบล็อก IP =====
const DUR = [[1, '1 ชั่วโมง'], [24, '24 ชั่วโมง'], [168, '7 วัน'], [720, '30 วัน'], [0, 'ถาวร']];
function Bans(){
  const [list, setList] = useState(null), [f, setF] = useState({ ip:'', hours:24, reason:'' }), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const load = () => api('/api/admin/bans').then(r => setList(r.data?.bans || []));
  useEffect(() => { load(); }, []);
  async function ban(){
    setBusy(true); setMsg(null); const r = await send('/api/admin/bans', { ip:f.ip.trim(), hours:Number(f.hours), reason:f.reason });
    setBusy(false); if(r.ok){ setF({ ip:'', hours:f.hours, reason:'' }); setMsg({ ok:true, t:'แบนแล้ว มีผลกับสคริปต์ทุกเส้นทางทันที' }); load(); } else setMsg({ ok:false, t:r.data?.error === 'bad_ip' ? 'รูปแบบ IP ไม่ถูกต้อง (ตัวอย่าง 203.0.113.9)' : 'แบนไม่สำเร็จ' });
  }
  async function unban(ip){ if(!confirm('ปลดบล็อก ' + ip + ' ?')) return; await send('/api/admin/bans', { ip }, 'DELETE'); load(); }
  return (<Panel title="แบน / ปลดบล็อก IP" sub="บล็อกการเข้าถึงสคริปต์ (/loader /raw /stage /auth) ของ IP นั้นทันที · หน้าเว็บและหลังบ้านไม่ถูกบล็อก">
    <div className="two" style={{ gap:8, flexWrap:'wrap' }}>
      <input value={f.ip} onChange={e => setF({ ...f, ip:e.target.value })} placeholder="IP เช่น 203.0.113.9" spellCheck={false} style={{ minWidth:180 }}/>
      <select value={f.hours} onChange={e => setF({ ...f, hours:e.target.value })}>{DUR.map(([h, t]) => <option key={h} value={h}>{t}</option>)}</select>
      <input value={f.reason} onChange={e => setF({ ...f, reason:e.target.value })} placeholder="เหตุผล (ไม่บังคับ)" maxLength={120}/>
      <button className="btn sm danger" disabled={busy || !f.ip.trim()} onClick={ban}>แบน IP</button></div>
    {msg && <div className={'note ' + (msg.ok ? '' : 'bad')} style={{ marginTop:10 }}>{msg.t}</div>}
    {!list ? <Empty>กำลังโหลด…</Empty> : !list.length ? <Empty>ยังไม่มี IP ที่ถูกแบน</Empty> :
      <div className="ad-tw short" style={{ marginTop:12 }}><table><thead><tr><th>IP</th><th>ที่มา</th><th>เหตุผล</th><th>แบนเมื่อ</th><th>หมดอายุ</th><th/></tr></thead>
        <tbody>{list.map(b => <tr key={b.ip}><td className="s">{b.ip}</td><td><Pill tone={b.auto ? 'warn' : 'bad'}>{b.auto ? 'อัตโนมัติ' : 'แอดมิน'}</Pill>{!b.auto && b.by && <small className="dim"> {b.by}</small>}</td><td>{b.reason || '—'}</td><td>{fmtDate(b.ts)}</td><td>{b.exp ? fmtDate(b.exp) : 'ถาวร'}</td>
          <td><button className="btn sm" onClick={() => unban(b.ip)}>ปลดบล็อก</button></td></tr>)}</tbody></table></div>}
  </Panel>);
}

export default function SettingsPage(){
  const [s, setS] = useState(null), [sec, setSec] = useState(null), [cp, copy] = useCopy();
  useEffect(() => { api('/api/admin/status').then(r => setS(r.data)); api('/api/admin/security').then(r => setSec(r.data)); }, []);
  const hosts = s?.hosts || [], snippet = hosts.length ? (hosts.length > 1 ? failover(hosts, '/loader') : ls('https://' + hosts[0] + '/loader')) : '';
  const ready = s && s.checks.every(c => c.ok || c.optional), counts = sec?.counts || {};
  return (<div className="stack">
    <div className="ad-grid ad-g2e">
      <Panel title="สถานะการตั้งค่า" actions={s && <Pill tone={ready ? 'ok' : 'bad'}>{ready ? 'พร้อมใช้งาน' : 'ต้องตั้งค่าเพิ่ม'}</Pill>}>
        {!s ? <Empty>กำลังโหลด…</Empty> : <div className="ad-checks">{s.checks.map(c => <div key={c.id} className={'ad-check ' + (c.ok ? 'ok' : c.optional ? 'opt' : 'no')}><i>{c.ok ? '✓' : c.optional ? '!' : '✕'}</i><div><b>{c.label}</b>{!c.ok && <small>{c.fix}</small>}</div></div>)}</div>}
      </Panel>
      <Panel title="ชั้นป้องกัน Loader" sub="สถานะจริงจากค่า ENV ปัจจุบัน">
        {!sec ? <Empty>กำลังโหลด…</Empty> : <ul className="layers">{sec.layers.map(l => <li key={l.id}><Pill tone={l.on ? 'ok' : 'bad'}>{l.on ? 'เปิด' : 'ปิด'}</Pill><div><b>{l.label}</b><small>{l.hint}</small></div></li>)}</ul>}
        <div className="note" style={{ marginTop:14 }}>ข้อจำกัดที่ต้องรู้: URL ที่ส่งโค้ดรันได้ ไม่มีทางกันการอ่านได้ 100% — ชั้นเหล่านี้ทำให้ dump แล้ว <b>ได้ข้อมูลที่ใช้ต่อไม่ได้</b> (ซีล + token ผูก IP ใช้ครั้งเดียว) และทำให้ดึงซ้ำ ๆ ถูกแบน ส่วนของที่ต้องปกป้องจริงคือสคริปต์แมพ ซึ่งซ่อนไว้หลัง key + HWID</div>
      </Panel>
    </div>
    <Bans/>
    <Panel title="เครื่องมือทดสอบระบบกัน dump" sub="ทุกปุ่มทำงานกับระบบจริง"><Lab/></Panel>
    <div className="ad-grid ad-g2e">
      <Panel title="เหตุการณ์ความปลอดภัย" sub={`24 ชม.ล่าสุด: ${Object.entries(counts).map(([k, v]) => `${(EV[k] || [, k])[1]} ${v}`).join(' · ') || 'ไม่มี'}`}>
        {!sec ? <Empty>กำลังโหลด…</Empty> : !sec.events.length ? <Empty>ยังไม่มีเหตุการณ์</Empty> :
          <div className="ad-tw short"><table><thead><tr><th>เวลา</th><th>เหตุการณ์</th><th>IP</th><th>รายละเอียด</th></tr></thead>
            <tbody>{sec.events.map((e, i) => { const [tone, label] = EV[e.t] || ['', e.t]; return <tr key={i}><td>{fmtDate(e.ts)}</td><td><Pill tone={tone}>{label}</Pill></td><td className="s">{e.ip}</td><td>{e.info}</td></tr>; })}</tbody></table></div>}
      </Panel>
      <Panel title="โค้ดโหลด Hub" sub={hosts.length > 1 ? 'ลองโดเมนสำรองอัตโนมัติถ้าโดเมนหลักถูกบล็อก' : 'ยังไม่มีโดเมนสำรอง — ตั้ง API_FALLBACK_HOSTS (ดู docs/CLOUDFLARE.md)'}>
        {snippet ? <pre className="snip">{snippet}</pre> : <Empty>ยังไม่ได้ตั้ง API_HOST</Empty>}
        <div className="row" style={{ marginTop:12 }}><button className="btn" disabled={!snippet} onClick={() => copy(snippet, 'ls')}>{cp === 'ls' ? 'คัดลอกแล้ว ✓' : 'คัดลอกโค้ด'}</button></div>
        {hosts.length > 0 && <div className="tags" style={{ marginTop:14 }}>{hosts.map((h, i) => <Pill key={h} tone={i ? '' : 'blue'}>{i ? 'สำรอง' : 'หลัก'} · {h}</Pill>)}</div>}
      </Panel>
    </div>
  </div>);
}
