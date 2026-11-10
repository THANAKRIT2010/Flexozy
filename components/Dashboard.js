'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import LinkForm, { ls, copyText } from '@/components/LinkForm';
import { Avatar, Modal, ProfileModal, PlayersList } from '@/components/Ui';
import EditLink from '@/components/EditLink';
import Icon from '@/components/Icons';
import { Spark, AreaChart, fmt, dlabel } from '@/components/Charts';

const VIEWS = {
  overview:{ t:'ภาพรวม', s:'ยอดรันสคริปต์ ลิงก์ที่สร้าง และ TOKEN ที่ใช้ ในช่วงเวลาที่เลือก', i:'chart' },
  create:{ t:'ฝากลิงก์ใหม่', s:'วางโค้ด Lua แล้วแปลงเป็นลิงก์ส่วนตัว พร้อมล็อกรหัสผ่านได้', i:'plus' },
  links:{ t:'ลิงก์ของฉัน', s:'คัดลอก loadstring แก้ไข ดูผู้เล่น และลบลิงก์ที่ฝากไว้', i:'link' },
  tokens:{ t:'TOKEN', s:'ยอดคงเหลือและกติกาการใช้ TOKEN ของบัญชีนี้', i:'bolt' },
};
const NAV = [[null, ['overview']], ['สคริปต์', ['create', 'links']], ['บัญชี', ['tokens']]];
const SER = [{ key:'r', name:'ยอดรัน', color:'#fafafa' }, { key:'l', name:'ลิงก์ใหม่', color:'#a1a1aa' }, { key:'k', name:'ล็อกรหัส', color:'#71717a' }];
const sum = (a) => a.reduce((x, y) => x + y, 0);

export default function Dashboard({ site }){
  const [me, setMe] = useState(undefined), [data, setData] = useState(null), [days, setDays] = useState(30), [view, setView] = useState('overview');
  const [hid, setHid] = useState([]), [side, setSide] = useState(false), [menu, setMenu] = useState(false), [pal, setPal] = useState(false), [q, setQ] = useState(''), [pq, setPq] = useState('');
  const [cp, setCp] = useState(''), [prof, setProf] = useState(false), [pl, setPl] = useState(null), [ed, setEd] = useState(null), [busy, setBusy] = useState(false);
  const menuRef = useRef(null);

  const load = useCallback(async (d, fresh) => {
    setBusy(true);
    try{ const r = await fetch(`/api/dash?days=${d}${fresh ? '&fresh=1' : ''}`), j = await r.json();
      if(j.authenticated){ setMe(j.user); setData(j); } else setMe(null); }
    catch{ setMe(m => m === undefined ? null : m); } finally{ setBusy(false); }
  }, []);
  useEffect(() => { load(30); }, [load]);
  const pick = (d) => { setDays(d); load(d, false); };
  const reload = () => load(days, true);

  useEffect(() => { const f = () => { const h = location.hash.slice(1); setView(VIEWS[h] ? h : 'overview'); setSide(false); }; f(); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => { const k = (e) => { if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); setPal(p => !p); } if(e.key === 'Escape'){ setPal(false); setMenu(false); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  useEffect(() => { const c = (e) => { if(menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); }; addEventListener('mousedown', c); return () => removeEventListener('mousedown', c); }, []);

  const go = (v) => { setPq(''); location.hash = v === 'overview' ? '' : v; if(v === 'overview') setView('overview'); setSide(false); setPal(false); };
  const links = data?.links || [], tok = data?.tokens, cost = data?.lock_cost || 1000, series = data?.series || [];
  const copy = (t, k) => { copyText(t); setCp(k); setTimeout(() => setCp(''), 1200); };
  async function del(code){ if(!confirm('ลบลิงก์นี้ใช่ไหม? ลิงก์ที่ลบแล้วกู้คืนไม่ได้')) return; await fetch('/api/vault/' + code, { method:'DELETE' }); reload(); }

  const S = useMemo(() => { const g = (k) => series.map(x => x[k] || 0); const r = g('r'), l = g('l'), k = g('k'), t = g('t'); return { r, l, k, t, R:sum(r), L:sum(l), K:sum(k), T:sum(t) }; }, [series]);
  const locked = links.filter(v => v.has_password).length, lockPct = links.length ? Math.round(locked / links.length * 100) : 0;

  /* ---------- ยังไม่ล็อกอิน ---------- */
  if(me === null) return (<div className="fx dz dz-land"><header className="dz-lbar"><a className="dz-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>{site.hero.title}</b></a><span className="grow"/>
      <a className="dz-btn pri" href="/login/discord">เข้าสู่ระบบด้วย Discord</a></header>
    <main className="dz-hero">{site.hero.badge && <span className="dz-badge"><i/>{site.hero.badge}</span>}
      <h1>{site.hero.title}</h1><p>{site.hero.tagline}</p>
      <a className="dz-btn pri lg" href="/login/discord">เริ่มต้นใช้งาน <Icon n="arrow" size={18}/></a>
      {site.stats.length > 0 && <div className="dz-pub">{site.stats.map(s => <div className="dz-card" key={s.id}><div className="dz-card-h"><span>{s.label}</span><i><Icon n={s.icon} size={15}/></i></div><b>{fmt(s.value)}</b><em>{s.unit || '\u00a0'}</em></div>)}</div>}
      <ul className="dz-feat"><li><Icon n="shield" size={18}/><b>ป้องกันการดึงสคริปต์</b><span>ซอร์สส่งผ่าน token ครั้งเดียว ผูก IP + UA คนที่ดึงด้วย HttpGet ตรงๆ จะได้แค่ stub ไม่มีซอร์ส</span></li>
        <li><Icon n="lock" size={18}/><b>ล็อกรหัสผ่านได้</b><span>ซ่อนซอร์สจากหน้าเว็บ แต่ยังรันในเกมได้ตามปกติ</span></li>
        <li><Icon n="key" size={18}/><b>ระบบ Key + HWID</b><span>ผูกเครื่องแรกที่ใช้ เพิกถอนและรีเซ็ตได้ทันที</span></li></ul>
    </main><footer className="dz-foot">© {new Date().getFullYear()} {site.hero.title}</footer></div>);

  if(me === undefined) return (<div className="fx dz dz-load"><div className="dz-skel" style={{ width:220, height:18 }}/></div>);

  const V = VIEWS[view], items = [...NAV.flatMap(g => g[1]).map(k => ({ k, t:VIEWS[k].t, i:VIEWS[k].i, act:() => go(k) })),
    ...(me.is_admin ? [{ k:'admin', t:'หลังบ้านแอดมิน', i:'shield', act:() => { location.href = '/admin'; } }] : []),
    ...links.map(v => ({ k:'l' + v.code, t:v.title, sub:v.code, i:'link', act:() => { setQ(v.code); go('links'); } }))];
  const fl = links.filter(v => !q || (v.title + ' ' + v.code).toLowerCase().includes(q.toLowerCase()));
  const labels = series.map(x => x.d), range = labels.length ? `${dlabel(labels[0])} – ${dlabel(labels.at(-1))}` : '';
  const cards = [
    { n:'ลิงก์ที่สร้าง', v:S.L, s:S.l, c:'#fafafa', i:'link', f:<><b>{fmt(links.length)}</b> ลิงก์ทั้งหมด</> },
    { n:'ลิงก์ล็อกรหัส', v:S.K, s:S.k, c:'#d4d4d8', i:'lock', f:<><b>{lockPct}%</b> ของลิงก์ทั้งหมด</> },
    { n:'ยอดรันสคริปต์', v:S.R, s:S.r, c:'#a1a1aa', i:'play', f:<><b>{fmt(S.R / (series.length || 1))}</b> ครั้งต่อวัน</> },
    { n:'TOKEN ที่ใช้', v:S.T, s:S.t, c:'#71717a', i:'bolt', f:<><b>{tok === null || tok === undefined ? '–' : fmt(tok)}</b> คงเหลือ</> },
  ];

  return (<div className={'fx dz' + (side ? ' open' : '')}>
    <div className="dz-scrim" onClick={() => setSide(false)}/>
    <aside className="dz-side">
      <a className="dz-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>{site.hero.title}</b></a>
      <nav>{NAV.map(([g, ks]) => <div key={g || 'top'}>{g && <div className="dz-grp">{g}</div>}
        {ks.map(k => <a key={k} href={k === 'overview' ? '#' : '#' + k} className={view === k ? 'on' : ''} onClick={(e) => { e.preventDefault(); go(k); }}><Icon n={VIEWS[k].i} size={17}/>{VIEWS[k].t}{k === 'links' && links.length > 0 && <em>{links.length}</em>}</a>)}</div>)}
        {me.is_admin && <div><div className="dz-grp">แอดมิน</div>
          <a href="/admin"><Icon n="shield" size={17}/>ภาพรวมระบบ</a><a href="/admin/keys"><Icon n="key" size={17}/>Key ผู้ใช้</a><a href="/admin/maps"><Icon n="map" size={17}/>แมพของ Hub</a><a href="/admin/appearance"><Icon n="palette" size={17}/>หน้าตาเว็บ</a></div>}
      </nav>
      <div className="grow"/>
      <button className="dz-me" onClick={() => setProf(true)}><Avatar src={me.avatar} name={me.username} size={30}/><span><b>{me.username}</b><small>{me.is_admin ? 'แอดมิน' : 'ผู้ใช้'}</small></span></button>
    </aside>

    <div className="dz-col">
      <header className="dz-bar">
        <button className="dz-ib" onClick={() => setSide(s => !s)} aria-label="เมนู"><Icon n="menu" size={18}/></button>
        <nav className="dz-crumb"><a href="#" onClick={(e) => { e.preventDefault(); go('overview'); }}>Dashboard</a><i>›</i><Icon n={V.i} size={14}/><b>{V.t}</b></nav>
        <span className="grow"/>
        <button className="dz-search" onClick={() => setPal(true)}><Icon n="eye" size={15}/><span>ค้นหา</span><kbd>Ctrl</kbd><kbd>K</kbd></button>
        <div className="dz-dd" ref={menuRef}><button className="dz-sel" onClick={() => setMenu(m => !m)}><Icon n="user" size={15}/><span>{me.username}</span><Icon n="down" size={14}/></button>
          {menu && <div className="dz-menu"><button onClick={() => { setMenu(false); setProf(true); }}><Icon n="user" size={15}/>โปรไฟล์</button>{me.is_admin && <a href="/admin"><Icon n="shield" size={15}/>หลังบ้านแอดมิน</a>}<a href="/logout"><Icon n="logout" size={15}/>ออกจากระบบ</a></div>}</div>
        <button className="dz-tk" onClick={() => go('tokens')} title="TOKEN คงเหลือ"><Icon n="bolt" size={15}/>Tokens<b>{tok === null || tok === undefined ? '–' : tok.toLocaleString()}</b></button>
      </header>

      <main className="dz-main"><section className="dz-page">
        <div className="dz-ph"><i className="dz-ico"><Icon n={V.i} size={22}/></i><div><h1>{V.t}</h1><p>{V.s}</p></div><span className="grow"/>
          {view === 'overview' && <div className="dz-per"><div className="dz-seg" role="tablist">{[7, 14, 30].map(d => <button key={d} className={days === d ? 'on' : ''} onClick={() => pick(d)}>{d}d</button>)}</div><small>{range} · <span className={'dz-dot' + (busy ? ' b' : '')}/>{busy ? 'กำลังโหลด' : 'อัปเดตเมื่อครู่'}</small></div>}
        </div>

        {view === 'overview' && <>
          <div className="dz-sec"><h2>สรุปกิจกรรม</h2><p>ยอดรวมของช่วง {days} วัน เวลาไทย · เก็บย้อนหลังสูงสุด 30 วัน</p></div>
          <div className="dz-funnel">{cards.map((c, i) => <div className="dz-fc" key={c.n}>
            <div className="dz-card"><div className="dz-card-h"><span>{c.n}</span><i style={{ color:c.c }}><Icon n={c.i} size={15}/></i></div><b>{fmt(c.v)}</b>
              <small>{range}</small><Spark values={c.s.length ? c.s : [0, 0]} color={c.c}/><div className="dz-card-f">{c.f}</div></div>{i < cards.length - 1 && <span className="dz-arr"><Icon n="arrow" size={12}/></span>}</div>)}</div>
          <div className="dz-card dz-big">
            <div className="dz-bh"><div><h3><Icon n="chart" size={16}/>กิจกรรมรวม</h3><p>แสดงกิจกรรมย้อนหลัง {days} วัน</p></div><span className="grow"/>
              <div className="dz-leg">{SER.map(s => <button key={s.key} className={hid.includes(s.key) ? 'off' : ''} onClick={() => setHid(h => h.includes(s.key) ? h.filter(x => x !== s.key) : [...h, s.key])}><i style={{ background:s.color }}/>{s.name}</button>)}</div></div>
            <div className="dz-pills"><span>อัตราล็อกรหัส: <b>{lockPct}%</b></span><span>เฉลี่ย: <b>{fmt(S.R / (series.length || 1))}</b> รัน/วัน</span></div>
            <AreaChart labels={labels} hidden={hid} series={SER.map(s => ({ ...s, values:S[s.key] }))}/></div></>}

        {view === 'create' && <div className="dz-narrow"><LinkForm endpoint="/api/vault" onCreated={reload} tokens={tok ?? null} lockCost={cost} admin={!!me.is_admin}/></div>}

        {view === 'links' && <>
          <div className="dz-tools"><div className="dz-find"><Icon n="eye" size={15}/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสลิงก์"/></div><span className="grow"/><a className="dz-btn pri" href="#create" onClick={(e) => { e.preventDefault(); go('create'); }}><Icon n="plus" size={15}/>ฝากลิงก์ใหม่</a></div>
          {fl.length === 0 ? <div className="dz-empty"><Icon n="link" size={26}/><b>{links.length ? 'ไม่พบลิงก์ที่ค้นหา' : 'ยังไม่มีลิงก์'}</b><span>{links.length ? 'ลองใช้คำอื่น' : 'ฝากสคริปต์แรกของคุณได้เลย'}</span></div>
          : <div className="dz-list">{fl.map(v => <div className="dz-row" key={v.code}>
              <i className="dz-ico sm"><Icon n={v.has_password ? 'lock' : 'link'} size={16}/></i>
              <div className="dz-rt"><b>{v.title}</b><small>{v.code} · {fmt(v.views)} รัน · {new Date(v.created_at).toLocaleDateString('th-TH')}{v.has_password && ' · ล็อกรหัส'}</small></div>
              <div className="dz-ra"><button className="dz-btn" onClick={() => copy(ls(v.raw_url), v.code)}>{cp === v.code ? 'คัดลอกแล้ว ✓' : 'Loadstring'}</button><a className="dz-btn" href={v.raw_url} target="_blank" rel="noreferrer">Raw</a>
                <button className="dz-btn" onClick={() => setEd(v.code)}>แก้ไข</button><button className="dz-btn" onClick={() => setPl(v.code)}>ผู้เล่น</button><a className="dz-btn" href={`/vault/${v.code}`}>ดูโค้ด</a><button className="dz-btn dng" onClick={() => del(v.code)}>ลบ</button></div></div>)}</div>}</>}

        {view === 'tokens' && <div className="dz-tokens">
          <div className="dz-card dz-bal"><div className="dz-card-h"><span>ยอดคงเหลือ</span><i><Icon n="bolt" size={15}/></i></div><b>{tok === null || tok === undefined ? '–' : tok.toLocaleString()}</b><small>TOKEN</small>
            <div className="dz-card-f"><b>{tok == null ? '–' : Math.floor(tok / cost)}</b> ลิงก์ล็อกรหัสที่ฝากได้อีก</div></div>
          <div className="dz-card"><h3>กติกา</h3><ul className="dz-rules"><li><Icon n="check" size={15}/>บัญชีใหม่ได้ <b>10,000</b> TOKEN เมื่อเข้าใช้งานครั้งแรก</li>
            <li><Icon n="check" size={15}/>ฝากลิงก์<b>ล็อกรหัสผ่าน</b> หัก <b>{cost.toLocaleString()}</b> TOKEN ต่อลิงก์</li><li><Icon n="check" size={15}/>ฝากลิงก์ธรรมดา <b>ฟรี</b></li>
            <li><Icon n="check" size={15}/>ใส่รหัสผ่านให้ลิงก์เดิมครั้งแรก หัก {cost.toLocaleString()} เช่นกัน · เปลี่ยนรหัสภายหลังไม่หักเพิ่ม</li><li><Icon n="check" size={15}/>บันทึกลิงก์ไม่สำเร็จ ระบบคืน TOKEN ให้อัตโนมัติ</li></ul>
            <a className="dz-btn pri" href="#create" onClick={(e) => { e.preventDefault(); go('create'); }}>ฝากลิงก์ใหม่</a></div>
          <div className="dz-card"><div className="dz-card-h"><span>TOKEN ที่ใช้ ({days} วัน)</span><i><Icon n="chart" size={15}/></i></div><b>{S.T.toLocaleString()}</b><Spark values={S.t.length ? S.t : [0, 0]} color="#a1a1aa" h={70}/></div></div>}
      </section><footer className="dz-foot">© {new Date().getFullYear()} {site.hero.title}</footer></main>
    </div>

    {pal && <div className="dz-pal" onMouseDown={(e) => e.target === e.currentTarget && setPal(false)}><div className="dz-palbox"><input autoFocus placeholder="พิมพ์เพื่อค้นหาหน้าหรือลิงก์…" value={pq} onChange={(e) => setPq(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter'){ const f = items.filter(x => !pq || (x.t + ' ' + (x.sub || '')).toLowerCase().includes(pq.toLowerCase()))[0]; f && f.act(); } }}/>
      <div className="dz-palist">{items.filter(x => !pq || (x.t + ' ' + (x.sub || '')).toLowerCase().includes(pq.toLowerCase())).slice(0, 8).map(x => <button key={x.k} onClick={x.act}><Icon n={x.i} size={15}/><span>{x.t}</span>{x.sub && <small>{x.sub}</small>}</button>)}</div></div></div>}
    {prof && <ProfileModal p={{ name:me.username, avatar:me.avatar, id:me.id, tag:me.is_admin ? 'ADMIN' : '', logout:true }} links={links} onClose={() => setProf(false)} onPlayers={c => { setProf(false); setPl(c); }}/>}
    {ed && <EditLink code={ed} onClose={() => setEd(null)} onSaved={reload} lockCost={cost}/>}
    {pl && <Modal onClose={() => setPl(null)}><h3 className="mdl-t">ผู้เล่นที่กำลังใช้ · {pl}</h3><PlayersList code={pl}/></Modal>}
  </div>);
}
