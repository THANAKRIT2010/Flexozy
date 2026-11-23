'use client';
import { useRef, useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icons';
import { copyText } from '@/components/LinkForm';
// สตูดิโอ obfuscate — พาร์เซอร์/คอมไพเลอร์/VM runtime generator เป็น JS ล้วน (lib/obf/*) พอร์ตมาจาก
// โมดูล Python ต้นฉบับ ตรวจแล้วว่าให้ผลลัพธ์ตรงกับของเดิม 100% เมื่อรันจริงผ่าน Luau (ดู docs)
// Prettify/Minify ยังไม่ได้ต่อระบบจริง ปิดปุ่มไว้ก่อนเพื่อไม่ให้เข้าใจผิดว่าใช้ได้
const MAX_IN = 300000;
const MODES = [
  { k: 'obfuscate', t: 'Obfuscate', on: true },
  { k: 'prettify', t: 'Prettify', on: false },
  { k: 'minify', t: 'Minify', on: false },
];

function numbers(count){
  let s = '';
  for (let i = 1; i <= count; i++) s += i + '\n';
  return s;
}

export default function ObfuscateStudio(){
  const [script, setScript] = useState(''), [out, setOut] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [cp, setCp] = useState(false);
  const gut = useRef(null), ogut = useRef(null);

  const lines = useMemo(() => (script ? script.split('\n').length : 0), [script]);
  const outLines = useMemo(() => (out ? out.split('\n').length : 0), [out]);
  const nums = useMemo(() => numbers(Math.min(Math.max(lines, 18), 5000)), [lines]);
  const onums = useMemo(() => numbers(Math.min(Math.max(outLines, 18), 5000)), [outLines]);
  const pct = Math.min(100, (script.length / MAX_IN) * 100);
  const outBytes = useMemo(() => new Blob([out]).size, [out]);

  // Ctrl/⌘ + Enter = รัน obfuscate
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  async function run(){
    if(busy || !script.trim()) return;
    setBusy(true); setErr('');
    try{
      const r = await fetch('/api/obfuscate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ script }) });
      const d = await r.json();
      if(!r.ok) setErr(d.message || 'obfuscate ไม่สำเร็จ'); else setOut(d.output);
    }catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    setBusy(false);
  }
  function copy(){ copyText(out); setCp(true); setTimeout(() => setCp(false), 1200); }
  function download(){
    const blob = new Blob([out], { type:'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'obfuscated.lua'; a.click(); URL.revokeObjectURL(a.href);
  }
  function clear(){ setScript(''); setOut(''); setErr(''); }

  return (<div className="obz">
    <header className="obz-top">
      <div className="obz-title">
        <span className="obz-badge"><Icon n="shield" size={20}/></span>
        <div><h2>สตูดิโอ Obfuscate</h2><p>วางโค้ด Lua แล้วกด Obfuscate — พาร์เซอร์ คอมไพเลอร์ และ VM เป็นของเราเองทั้งหมด</p></div>
      </div>
      <div className="obz-chips">
        <span className="obz-chip"><b>{lines.toLocaleString()}</b> บรรทัด</span>
        <span className={'obz-chip' + (out ? ' ok' : '')}><i/>{out ? 'สร้างแล้ว' : 'ยังไม่สร้าง'}</span>
      </div>
    </header>

    <div className="obz-bar">
      <div className="obz-modes" role="tablist" aria-label="โหมด">
        {MODES.map(m => (
          <button key={m.k} type="button" role="tab" aria-selected={m.on} className={m.on ? 'on' : ''} disabled={!m.on} title={m.on ? '' : 'ยังไม่เปิดใช้งาน'}>
            {m.t}{!m.on && <em>เร็วๆ นี้</em>}
          </button>
        ))}
      </div>
      <div className="obz-actions">
        {script && <button type="button" className="obz-ghost" onClick={clear}><Icon n="trash" size={13}/>ล้างทั้งหมด</button>}
        <button type="button" className="obz-go" disabled={busy || !script.trim()} onClick={run}>
          {busy ? <><span className="obz-spin"/>กำลังสร้าง…</> : <><Icon n="shield" size={15}/>Obfuscate<kbd>Ctrl ↵</kbd></>}
        </button>
      </div>
    </div>

    <div className="obz-deck">
      <section className="obz-pane">
        <div className="obz-head">
          <div className="obz-file"><span className="obz-dot"/><span className="obz-name">script.luau</span></div>
          <div className="obz-tools">
            <button type="button" className="obz-ghost sm" onClick={() => setScript('')} disabled={!script}><Icon n="trash" size={12}/>ล้าง</button>
          </div>
        </div>
        <div className="obz-ed">
          <pre className="obz-gut" ref={gut} aria-hidden="true">{nums}</pre>
          <textarea className="obz-ta" value={script}
            onChange={(e) => setScript(e.target.value.slice(0, MAX_IN))}
            onScroll={(e) => { if(gut.current) gut.current.scrollTop = e.target.scrollTop; }}
            placeholder={'-- วางโค้ด Lua ของคุณที่นี่\nprint("Hello World")'} spellCheck={false} wrap="off" aria-label="โค้ดต้นฉบับ"/>
        </div>
        <div className="obz-foot">
          <span>{lines.toLocaleString()} บรรทัด</span>
          <div className="obz-meter"><i style={{ width: pct + '%' }} className={pct > 90 ? 'hot' : ''}/></div>
          <span className="obz-num">{script.length.toLocaleString()} / {MAX_IN.toLocaleString()}</span>
        </div>
      </section>

      <div className="obz-flow" aria-hidden="true"><span><Icon n="arrow" size={14}/></span></div>

      <section className="obz-pane">
        <div className="obz-head">
          <div className="obz-file"><span className={'obz-dot' + (out ? ' ok' : '')}/><span className="obz-name">output.lua</span></div>
          <div className="obz-tools">
            {out && <>
              <button type="button" className={'obz-ghost sm' + (cp ? ' done' : '')} onClick={copy}><Icon n={cp ? 'check' : 'copy'} size={12}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button>
              <button type="button" className="obz-ghost sm" onClick={download}><Icon n="download" size={12}/>ดาวน์โหลด</button>
            </>}
          </div>
        </div>
        <div className="obz-ed">
          <pre className="obz-gut" ref={ogut} aria-hidden="true">{onums}</pre>
          <textarea className="obz-ta" value={out} readOnly onScroll={(e) => { if(ogut.current) ogut.current.scrollTop = e.target.scrollTop; }}
            spellCheck={false} wrap="off" aria-label="ผลลัพธ์"/>
          {!out && !busy && <div className="obz-empty"><span><Icon n="code" size={22}/></span><b>ผลลัพธ์จะปรากฏที่นี่</b><small>กด Obfuscate เพื่อเริ่มสร้าง</small></div>}
          {busy && <div className="obz-busy"><span className="obz-spin lg"/><b>กำลังสร้าง…</b></div>}
        </div>
        <div className="obz-foot">
          <span>{outLines ? outLines.toLocaleString() + ' บรรทัด' : '—'}</span>
          <span className="obz-grow"/>
          <span className="obz-num">{out ? outBytes.toLocaleString() + ' B' : '—'}</span>
        </div>
      </section>
    </div>

    {err && <div className="obz-err" role="alert"><Icon n="bolt" size={15}/><span>{err}</span></div>}
  </div>);
}
