'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Icon from '@/components/Icons';
import { Avatar } from '@/components/Ui';
// v25.13 · หน้ารับ/ต่ออายุคีย์ จัดใหม่ตามดีไซน์ "Earn time": การ์ดเวลาคงเหลือ + การ์ดภารกิจ (YouTube / Discord)
// ภารกิจแต่ละข้อ: กด "เริ่ม" → เด้งไปหน้านั้น (แท็บใหม่) → กลับมาที่หน้านี้ → นับ 10 วิ → หมุนตรวจสอบ → ผ่าน
//   · Discord = เช็กสดผ่านบอท v2 ฝั่งเซิร์ฟเวอร์จริง ๆ (ไม่ผ่านถ้ายังไม่ได้เข้าเซิร์ฟเวอร์)
//   · YouTube = ฝั่งเซิร์ฟเวอร์ verify การกดติดตามไม่ได้ จึงผ่านด้วยเงื่อนไขเวลา (ต้องกดเริ่ม + รอครบ 10 วิ ซึ่งเซิร์ฟเวอร์เช็กซ้ำ)
const WAIT = 10, STORE = 'fx_tasks_v1', KEEP = 30 * 60000;
const ld = () => { try{ return JSON.parse(localStorage.getItem(STORE) || '{}'); }catch{ return {}; } };
const sv = (o) => { try{ localStorage.setItem(STORE, JSON.stringify(o)); }catch{} };
const post = (body) => fetch('/api/me/key', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
const timeParts = (ms) => { if(ms <= 0) return [['0', 'วัน'], ['0', 'ชม.']]; const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? [[d, 'วัน'], [h, 'ชม.']] : [[h, 'ชม.'], [m, 'นาที']]; };

// สถานะต่อภารกิจ: idle → wait (เปิดหน้าแล้ว รอผู้ใช้กลับมา) → count (นับ 10 วิ) → check (หมุนตรวจสอบ) → done | fail
function useTask(name, uid, url){
  const [st, setSt] = useState({ p:'idle', n:WAIT, msg:'' });
  const persist = useCallback((p) => { let o = ld(); if(o.uid !== uid) o = { uid };
    if(p) o[name] = { p, at:Date.now() }; else delete o[name]; sv(o); }, [name, uid]);
  // กลับมาจากการเปลี่ยนหน้าแบบเต็ม (เช่น popup ถูกบล็อกแล้วต้องเปิดในแท็บเดียวกัน) → กู้สถานะ
  useEffect(() => { const o = ld(), t = o.uid === uid ? o[name] : null;
    if(t && Date.now() - t.at < KEEP){ if(t.p === 'done') setSt({ p:'done', n:0, msg:'' }); else if(t.p === 'wait' || t.p === 'count') setSt({ p:'count', n:WAIT, msg:'' }); } }, [name, uid]);
  // รอผู้ใช้กลับมาที่แท็บนี้ (visibilitychange / focus) แล้วเริ่มนับ
  useEffect(() => { if(st.p !== 'wait') return; const t0 = Date.now();
    const back = () => { if(document.visibilityState === 'visible' && Date.now() - t0 > 1200) setSt({ p:'count', n:WAIT, msg:'' }); };
    document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); }; }, [st.p]);
  // นับถอยหลัง 10 วิ — ถ้าออกจากแท็บระหว่างนับ ให้กลับไปรอใหม่ (กันกดเริ่มแล้วปล่อยทิ้งไว้)
  useEffect(() => { if(st.p !== 'count') return;
    const iv = setInterval(() => setSt(s => s.p !== 'count' ? s : s.n <= 1 ? { ...s, p:'check', n:0 } : { ...s, n:s.n - 1 }), 1000);
    const hid = () => { if(document.visibilityState === 'hidden') setSt({ p:'wait', n:WAIT, msg:'' }); };
    document.addEventListener('visibilitychange', hid);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', hid); }; }, [st.p]);
  // หมุนตรวจสอบ (อย่างน้อย 1.6 วิ ให้เห็นว่ากำลังตรวจ) — เซิร์ฟเวอร์เช็กจริงอีกชั้น
  useEffect(() => { if(st.p !== 'check') return; let dead = false;
    (async () => { const t = Date.now(); let ok = false, msg = '';
      try{ const r = await post({ action:'verify', task:name }), d = await r.json().catch(() => ({})); ok = r.ok && d.ok === true; msg = d.message || (ok ? '' : 'ตรวจสอบไม่สำเร็จ ลองใหม่อีกครั้ง'); }
      catch{ msg = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'; }
      const left = 1600 - (Date.now() - t); if(left > 0) await new Promise(r => setTimeout(r, left));
      if(dead) return;
      if(ok){ persist('done'); setSt({ p:'done', n:0, msg:'' }); } else { persist(null); setSt({ p:'fail', n:0, msg }); } })();
    return () => { dead = true; }; }, [st.p, name, persist]);
  const start = async () => {
    persist('wait');
    if(!url){ await post({ action:'start', task:name }).catch(() => {}); setSt({ p:'count', n:WAIT, msg:'' }); return; } // ไม่มีลิงก์ให้เปิด → นับเลย
    const w = window.open(url, '_blank'); if(w){ try{ w.opener = null; }catch{} }
    setSt({ p:'wait', n:WAIT, msg:'' });
    await post({ action:'start', task:name }).catch(() => {});
    if(!w) location.href = url; // popup ถูกบล็อก → เปิดในแท็บเดียวกัน กลับมาแล้วกู้สถานะต่อ
  };
  const reset = () => { persist(null); setSt({ p:'idle', n:WAIT, msg:'' }); };
  const fail = (msg) => { persist(null); setSt({ p:'fail', n:0, msg }); };
  return { st, start, reset, fail };
}

const Spin = () => <i className="mk2-spin" aria-hidden="true"/>;
const Ext = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>;
function TaskRow({ grad, icon, title, sub, task }){
  const { st, start } = task, p = st.p, pct = p === 'count' ? (WAIT - st.n) / WAIT * 100 : p === 'check' || p === 'done' ? 100 : 0;
  const line = p === 'fail' ? st.msg : p === 'wait' ? 'กลับมาที่หน้านี้ เพื่อเริ่มนับ 10 วินาที' : p === 'count' ? `กำลังนับ… อีก ${st.n} วินาที` : p === 'check' ? 'กำลังตรวจสอบ…' : p === 'done' ? 'ผ่านแล้ว ✓' : sub;
  return (<div className={'mk2-row ' + p}>
    <div className="mk2-top">
      <span className="mk2-ic" style={{ background:grad }}><Icon n={icon} size={18}/></span>
      <div className="mk2-t"><b>{title}</b><small>{line}</small></div>
      {p === 'idle' && <button className="mk2-btn" onClick={start}><Ext/>เริ่ม</button>}
      {p === 'wait' && <button className="mk2-btn" disabled>รอกลับมา…</button>}
      {p === 'count' && <button className="mk2-btn" disabled><b className="mk2-n">{st.n}</b>วิ</button>}
      {p === 'check' && <button className="mk2-btn" disabled><Spin/>ตรวจสอบ</button>}
      {p === 'done' && <button className="mk2-btn" disabled><Icon n="check" size={14}/>ผ่านแล้ว</button>}
      {p === 'fail' && <button className="mk2-btn" onClick={start}><Ext/>ลองใหม่</button>}
    </div>
    <div className="mk2-steps"><i className={'n' + (p !== 'idle' ? ' on' : '')}>1</i><span className="ln"><b style={{ width:pct + '%' }}/></span><i className={'n' + (p === 'done' ? ' on ok' : '')}>{p === 'done' ? <Icon n="check" size={11}/> : 2}</i></div>
  </div>);
}

export default function MyKeyPanel({ me }){
  const [info, setInfo] = useState(undefined), [busy, setBusy] = useState(false), [cp, setCp] = useState(false), [err, setErr] = useState('');
  const load = useCallback(() => fetch('/api/me/key', { cache:'no-store' }).then(r => r.json()).then(setInfo).catch(() => setInfo(null)), []);
  useEffect(() => { load(); }, [load]);
  const yt = useTask('youtube', me?.id, info?.youtube_url), dc = useTask('discord', me?.id, info?.discord_url);
  const ready = yt.st.p === 'done' && dc.st.p === 'done', ytReset = useRef(yt.reset), dcReset = useRef(dc.reset), dcFail = useRef(dc.fail);
  ytReset.current = yt.reset; dcReset.current = dc.reset; dcFail.current = dc.fail;
  async function claim(){ setBusy(true); setErr('');
    try{ const r = await post({ action:'claim' }), d = await r.json();
      if(!r.ok){ if(d.error === 'not_in_discord') dcFail.current(d.message); setErr(d.message || 'รับคีย์ไม่สำเร็จ'); }
      else { setInfo(d); ytReset.current(); dcReset.current(); } }
    catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); } setBusy(false); }
  const copy = (k) => { navigator.clipboard.writeText(k); setCp(true); setTimeout(() => setCp(false), 1200); };
  if(info === undefined) return <div className="mk"><div className="sk" style={{ height:40, width:220, borderRadius:10, marginBottom:22 }}/><div className="sk" style={{ height:170, borderRadius:20, marginBottom:18 }}/><div className="sk" style={{ height:220, borderRadius:20 }}/></div>;
  if(!info?.enabled) return <div className="dz-empty"><Icon n="key" size={26}/><b>ยังไม่เปิดใช้งานระบบคีย์ผ่าน Discord</b><span>ติดต่อแอดมินถ้าต้องการใช้งานฟีเจอร์นี้</span></div>;
  const k = info.key, now = Date.now(), left = k?.exp ? k.exp - now : null, pct = left !== null ? Math.max(2, Math.min(100, left / (30 * 86400000) * 100)) : 0, low = left !== null && left < 6 * 3600000;
  return (<div className="mk">
    <div className="mk-hey"><Avatar src={me?.avatar} name={me?.username} size={46}/><div><h2>สวัสดี, {me?.username} <i>👋</i></h2><p>เวลาที่เหลือของคีย์ และวิธีรับเวลาเพิ่ม</p></div></div>

    <div className={'mk2-card mk-bal' + (k && !k.revoked ? ' on' : '')}>
      <div className="mk-bal-glow" aria-hidden="true"/>
      <div className="mk2-lbl"><span>เวลาคงเหลือ</span>{k && <span className={'mk-pill' + (k.revoked ? ' off' : low ? ' warn' : '')}><i/>{k.revoked ? 'ถูกเพิกถอน' : low ? 'ใกล้หมดอายุ' : 'ใช้งานอยู่'}</span>}</div>
      {!k ? <div className="mk-none"><span className="mk-none-ic"><Icon n="key" size={28}/></span><b>ยังไม่มีคีย์</b><span>ทำ 2 ภารกิจด้านล่างให้ครบ แล้วกดรับคีย์</span></div> : <>
        <div className="mk2-time">{k.exp ? timeParts(left).map(([v, u], i) => <span key={i}>{v}<small>{u}</small></span>) : <span className="inf">ไม่มีกำหนดหมดอายุ</span>}</div>
        {k.exp && <div className="mk-bar"><i style={{ width:pct + '%' }} className={low ? 'warn' : ''}/></div>}
        <div className="mk-sub"><Icon n="bolt" size={12}/>{k.exp ? `หมดอายุ ${new Date(k.exp).toLocaleString('th-TH', { dateStyle:'long', timeStyle:'short' })}` : 'ใช้ได้ตลอดไปจนกว่าแอดมินจะเพิกถอน'}</div>
      </>}
    </div>

    <div className="mk2-card">
      <div className="mk2-lbl"><span>รับเวลาเพิ่ม</span>{info.days > 0 && <span className="mk2-chip">+{info.days} วัน</span>}</div>
      <p className="mk2-desc">{k && !k.revoked ? 'ทำ 2 ภารกิจให้ครบอีกรอบ เพื่อต่ออายุคีย์' : 'ทำ 2 ภารกิจให้ครบ แล้วกดรับคีย์'}</p>
      <TaskRow task={yt} icon="play" grad="linear-gradient(145deg,#ff6161,#b30000)" title="ติดตาม YouTube" sub="กดเริ่ม → เปิดช่อง → กดติดตาม → กลับมาที่หน้านี้"/>
      <TaskRow task={dc} icon="users" grad="linear-gradient(145deg,#6b78ff,#3b45c4)" title="เข้าร่วม Discord" sub="กดเริ่ม → เข้าร่วมเซิร์ฟเวอร์ → กลับมา ระบบตรวจให้อัตโนมัติ"/>
      {!k || k.revoked
        ? <button className="cf-go mk-go" disabled={busy || !ready} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังตรวจสอบ…' : <>{k?.revoked ? 'ขอคีย์ใหม่' : 'รับคีย์'} <Icon n="spark" size={17}/></>}</span></button>
        : <button className="cf-go mk-go" disabled={busy || !ready} onClick={claim}><span className="cf-go-t">{busy ? 'กำลังต่ออายุ…' : <>ต่ออายุคีย์ <Icon n="spark" size={17}/></>}</span></button>}
      {err && <div className="cf-err err" style={{ marginTop:12 }}>{err}</div>}
    </div>

    {k && <div className="mk-keybox">
      <div className="mk-kb-h"><span className="mk-kb-ic"><Icon n="check" size={16}/></span><div><b>พร้อมใช้งาน</b><small>คัดลอกไปวางในหน้าฝากลิงก์ที่ต้องใช้ key ได้เลย</small></div></div>
      <div className="mk-key"><code>{k.key}</code><button className={'mk-cp' + (cp ? ' ok' : '')} onClick={() => copy(k.key)}><Icon n={cp ? 'check' : 'copy'} size={14}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button></div>
      <div className="lf-tags" style={{ marginTop:14 }}>
        <span className="on"><Icon n="bolt" size={12}/>ใช้แล้ว {k.runs.toLocaleString()} ครั้ง</span>
        <span className={k.bound ? 'on' : ''}><Icon n="shield" size={12}/>{k.bound ? 'ผูกเครื่องแล้ว' : 'ยังไม่ผูกเครื่อง'}</span>
        <span><Icon n="users" size={12}/>รับไปแล้ว {k.claims.toLocaleString()} ครั้ง</span>
      </div>
    </div>}
  </div>);
}
