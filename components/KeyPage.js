'use client';
import { useEffect, useState, useCallback } from 'react';
import { Avatar } from '@/components/Ui';
import Icon from '@/components/Icons';

const YT = () => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0033"/><path d="M10 9.2v5.6l4.8-2.8z" fill="#fff"/></svg>;
const DC = () => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#5865F2" d="M19.3 5.3A16 16 0 0 0 15.4 4l-.5 1a14.6 14.6 0 0 0-5.8 0L9 4a16 16 0 0 0-3.9 1.3C2.6 9.1 1.9 12.8 2.2 16.4a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11.4 11.4 0 0 0 9.8 0l.4.3c-.5.3-1 .6-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.4-4.2-.7-7.9-2.9-11.1zM9.1 14.2c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm5.9 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2z"/></svg>;
const LOGO = { youtube:YT, discord:DC };
const ERR = { too_early:'ยังไม่ครบ 15 วินาที รอให้ครบก่อนแล้วค่อยยืนยัน', not_started:'กดเริ่มก่อน', already_active:'มีคีย์ใช้งานอยู่แล้ว', done:'ทำขั้นนี้ไปแล้ว', bad_task:'ไม่รู้จักขั้นนี้', bad_action:'คำขอไม่ถูกต้อง', login:'กรุณาเข้าสู่ระบบใหม่', invalid_key:'คีย์ไม่ถูกต้องหรือหมดอายุแล้ว', key_used:'คีย์นี้ถูกผูกกับบัญชีอื่นแล้ว' };
const pad = (n) => String(n).padStart(2, '0');
const left = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return { d:Math.floor(s / 86400), h:Math.floor(s % 86400 / 3600), m:Math.floor(s % 3600 / 60) }; };

export default function KeyPage(){
  const [d, setD] = useState(null), [now, setNow] = useState(() => Date.now()), [busy, setBusy] = useState(''), [err, setErr] = useState(''), [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false), [redeemOpen, setRedeemOpen] = useState(false), [rkey, setRkey] = useState(''), [rbusy, setRbusy] = useState(false), [rmsg, setRmsg] = useState('');

  useEffect(() => {
    fetch('/api/keyflow', { cache:'no-store' }).then(r => r.json()).then(j => setD({ ...j, at:Date.now() })).catch(() => setD({ authenticated:false, at:Date.now() }));
    const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t);
  }, []);

  const apply = useCallback((j) => { const { err: _e, ...rest } = j; setD(p => ({ ...(p || {}), ...rest, at:Date.now() })); }, []);

  // เปิดลิงก์ก่อน fetch เพื่อไม่ให้เบราว์เซอร์บล็อกป๊อปอัป
  function act(action, task){
    if(busy) return;
    if(action === 'start'){ const t = d.tasks.find(x => x.id === task); if(t?.url) window.open(t.url, '_blank', 'noopener'); }
    setErr(''); setBusy(task);
    fetch('/api/keyflow', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ action, task }) })
      .then(r => r.json().catch(() => ({ err:'bad_action' })))
      .then(j => { if(j.err) setErr(ERR[j.err] || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'); apply(j); })
      .catch(() => setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'))
      .finally(() => setBusy(''));
  }

  async function redeem(e){
    e.preventDefault(); if(rbusy || !rkey.trim()) return;
    setRbusy(true); setRmsg('');
    try{
      const r = await fetch('/api/keyflow/redeem', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ key:rkey }) });
      const j = await r.json().catch(() => ({}));
      if(j.err) setRmsg(ERR[j.err] || 'แลกคีย์ไม่สำเร็จ'); else { setRkey(''); setRedeemOpen(false); apply(j); }
    }catch{ setRmsg('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    setRbusy(false);
  }

  async function copy(){
    try{ await navigator.clipboard.writeText(d.key); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch{ setErr('คัดลอกไม่สำเร็จ'); }
  }

  if(d === null) return <main className="kp"><div className="kp-wrap"><div className="kp-card kp-sk"/></div></main>;

  const shell = (inner, pill, me) => (
    <main className="kp">
      <header className="kp-top">
        <a className="kp-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/>FLEXOZY</a>
        <span className="kp-grow"/>
        {pill}
        {me && <div className="kp-dd">
          <button className="kp-me" onClick={() => setMenu(m => !m)}><Avatar src={me.avatar} name={me.username} size={24}/>{me.username}<Icon n="down" size={13}/></button>
          {menu && <div className="kp-menu">
            <div className="kp-mh"><Avatar src={me.avatar} name={me.username} size={34}/><div><b>{me.username}</b><small>Discord · {me.id}</small></div></div>
            <button onClick={() => { setMenu(false); setRedeemOpen(true); }}><Icon n="key" size={15}/>Redeem a key</button>
            <a href="/account" onClick={() => setMenu(false)}><Icon n="user" size={15}/>Account</a>
            <a href="https://discord.gg/WFUejxeggt" target="_blank" rel="noopener" onClick={() => setMenu(false)}><Icon n="users" size={15}/>Discord server</a>
            <a href="/logout" className="kp-out"><Icon n="logout" size={15}/>Log out</a>
          </div>}
        </div>}
      </header>
      <div className="kp-wrap">{inner}</div>
    </main>
  );

  if(!d.authenticated) return shell(
    <>
      <div className="kp-h"><h1>Hey, Guest</h1></div>
      <p className="kp-sub">เข้าสู่ระบบด้วย Discord เพื่อรับและผูกคีย์กับบัญชีของคุณ</p>
      <div className="kp-card kp-center"><b>ยังไม่ได้เข้าสู่ระบบ</b><p className="kp-sub">ใช้เวลาไม่ถึงหนึ่งนาทีในการรับคีย์</p>
        <a className="kp-btn lk" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></div>
    </>, null, null);

  const active = d.state === 'active', expired = d.state === 'expired', exp = d.exp;
  const remMs = active && exp ? Math.max(0, exp - now) : 0;
  const total = (d.days || 7) * 86400000;
  const pct = active ? (exp ? Math.min(100, remMs / total * 100) : 100) : 0;
  const T = left(remMs);
  const elapsed = now - (d.at || now);
  const waitOf = (t) => Math.max(0, (t.wait_left || 0) - elapsed);
  const dc = d.tasks.find(t => t.kind === 'discord');
  const pill = active ? <span className="kp-pill"><i/>{exp ? `${T.d}d ${pad(T.h)}h ${pad(T.m)}m left` : 'Lifetime'}</span> : null;

  return shell(<>
    <div className="kp-h"><h1>Hey, {d.user.username}</h1></div>
    <p className="kp-sub">เวลาคีย์ของคุณ และวิธีรับเวลาเพิ่ม</p>

    <div className="kp-card">
      <div className="kp-lbl"><span>Key Balance</span>
        <span className={'kp-badge' + (active ? ' on' : '')}>{active ? 'Active' : expired ? 'หมดอายุ' : 'ยังไม่มีคีย์'}</span></div>
      {active && exp ? <div className="kp-time">{T.d}<small>d</small>{pad(T.h)}<small>h</small>{pad(T.m)}<small>m</small></div>
        : active ? <div className="kp-time">ตลอดชีพ</div>
        : <div className="kp-time kp-dim">{expired ? '0d 00h 00m' : '--'}</div>}
      <div className="kp-bar"><div style={{ width:pct + '%' }}/></div>
      {active && exp && <div className="kp-meta">หมดอายุ {new Date(exp).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' })}</div>}
    </div>

    <div className="kp-card">
      <div className="kp-lbl"><span>Earn Key</span><span className="kp-badge">{d.days ? `${d.days} วัน` : 'ตลอดชีพ'}</span></div>
      <p className="kp-sub2">ทำครบทั้ง 2 ขั้นตอนเพื่อรับคีย์ · กด Start แล้วรอ 15 วินาทีก่อนยืนยัน</p>

      {d.tasks.map(t => {
        const Logo = LOGO[t.kind], L = waitOf(t), locked = active || !!busy;
        const started = t.started > 0 && !t.done, ready = started && L === 0, waiting = started && L > 0;
        const cp = t.done ? 100 : started ? 50 : 0;
        return (<div className="kp-task" key={t.id}>
          <div className="kp-logo"><Logo/></div>
          <div className="kp-tt"><b>{t.title}</b><span>{t.sub}</span></div>
          {t.done ? <button className="kp-btn ghost" disabled>✓ เสร็จแล้ว</button>
            : ready ? <button className="kp-btn" onClick={() => act('claim', t.id)} disabled={locked}>{busy === t.id ? '...' : 'ยืนยัน'}</button>
            : waiting ? <button className="kp-btn" disabled>รอ {Math.ceil(L / 1000)} วิ</button>
            : <button className="kp-btn" onClick={() => act('start', t.id)} disabled={locked}>{busy === t.id ? '...' : <><Icon n="link" size={14}/> Start</>}</button>}
          <div className="kp-cp">
            <span className={'kp-dot' + (t.started || t.done ? ' on' : '')}>1</span>
            <div className="ln"><div style={{ width:cp + '%' }}/></div>
            <span className={'kp-dot' + (t.done ? ' on' : '')}>2</span>
          </div>
        </div>);
      })}
      {err && <div className="kp-err">{err}</div>}
      {active && <div className="kp-note">มีคีย์ใช้งานอยู่แล้ว ทำขั้นตอนเพิ่มได้หลังคีย์หมดอายุ</div>}
    </div>

    <div className="kp-grid">
      <div className="kp-card kp-tile">
        <div className="kp-logo"><Icon n="key" size={20}/></div>
        <b>Redeem a key</b>
        {active ? <><div className="kp-key">{d.key}</div><button className="kp-btn ghost" onClick={copy}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกคีย์'}</button></>
          : redeemOpen ? <form className="kp-redeem" onSubmit={redeem}>
              <input value={rkey} onChange={e => setRkey(e.target.value)} placeholder="FX-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false}/>
              <button className="kp-btn" disabled={rbusy || !rkey.trim()}>{rbusy ? '...' : 'ใช้คีย์'}</button>
              {rmsg && <div className="kp-err">{rmsg}</div>}
            </form>
          : <><p>ซื้อคีย์มาแล้ว หรือเคยมีคีย์ก่อนมีบัญชี? ใส่คีย์เพื่อผูกกับบัญชีนี้</p>
              <button className="kp-btn ghost" onClick={() => setRedeemOpen(true)}>ใส่คีย์</button></>}
      </div>
      <a className="kp-card kp-tile kp-link" href={dc?.url} target="_blank" rel="noopener">
        <div className="kp-logo"><DC/></div>
        <b>Discord server</b>
        <p>อัปเดต ซัพพอร์ต และประกาศ</p>
      </a>
    </div>
  </>, pill, d.user);
}
