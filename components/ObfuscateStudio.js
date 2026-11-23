'use client';
import { useRef, useState, useMemo } from 'react';
import Icon from '@/components/Icons';
import { copyText } from '@/components/LinkForm';
// สตูดิโอ obfuscate — พาร์เซอร์/คอมไพเลอร์/VM runtime generator เป็น JS ล้วน (lib/obf/*) พอร์ตมาจาก
// โมดูล Python ต้นฉบับ ตรวจแล้วว่าให้ผลลัพธ์ตรงกับของเดิม 100% เมื่อรันจริงผ่าน Luau (ดู docs)
// Prettify/Minify ในภาพอ้างอิงยังไม่ได้ต่อระบบจริง ปิดปุ่มไว้ก่อนเพื่อไม่ให้เข้าใจผิดว่าใช้ได้
const MAX_IN = 300000;
export default function ObfuscateStudio(){
  const [script, setScript] = useState(''), [out, setOut] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [cp, setCp] = useState(false);
  const gut = useRef(null), ogut = useRef(null);
  const lines = useMemo(() => script ? script.split('\n').length : 1, [script]);
  const nums = useMemo(() => { const n = Math.min(Math.max(lines, 20), 5000); let s = ''; for(let i = 1; i <= n; i++) s += i + '\n'; return s; }, [lines]);
  const outLines = useMemo(() => out ? out.split('\n').length : 1, [out]);
  const onums = useMemo(() => { const n = Math.min(Math.max(outLines, 20), 5000); let s = ''; for(let i = 1; i <= n; i++) s += i + '\n'; return s; }, [outLines]);

  async function run(){
    if(busy || !script.trim()) return; setBusy(true); setErr('');
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

  return (<div className="mk">
    <div className="mk-hey"><h2>สตูดิโอ Obfuscate <i>🛡️</i></h2><p>วางโค้ด Lua แล้วกด Obfuscate — ตัวพาร์เซอร์/คอมไพเลอร์/VM เป็นของเราเองทั้งหมด</p></div>
    <div className="mq-controls">
      <div className="mq-left"><div className="mq-pills" role="tablist"><button type="button" className="on">Obfuscate</button>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน">Prettify</button>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน">Minify</button></div></div>
      <button className="mq-go" disabled={busy || !script.trim()} onClick={run}>{busy ? 'กำลังสร้าง…' : <><Icon n="shield" size={14}/>Obfuscate</>}</button>
    </div>
    <div className="mq-deck">
      <section className="mq-box">
        <div className="mq-head"><div className="mq-ttl"><span className="mq-dot"/><span className="mq-fn">script.luau</span><span className="mq-meta">{script.length.toLocaleString()} / {MAX_IN.toLocaleString()}</span></div>
          <div className="mq-ttl">{script && <button type="button" className="mq-b" onClick={() => setScript('')}><Icon n="trash" size={12}/>ล้าง</button>}</div></div>
        <div className="mq-ed"><pre className="cf-gut" ref={gut} aria-hidden="true">{nums}</pre>
          <textarea className="cf-ta" value={script} onChange={(e) => setScript(e.target.value.slice(0, MAX_IN))}
            onScroll={(e) => { if(gut.current) gut.current.scrollTop = e.target.scrollTop; }}
            placeholder={'print("Hello World")'} spellCheck={false} wrap="off"/></div>
      </section>
      <section className="mq-box">
        <div className="mq-head"><div className="mq-ttl"><span className={'mq-dot' + (out ? ' ok' : '')}/><span className="mq-fn">output.lua</span></div>
          <div className="mq-ttl">{out && <><button type="button" className="mq-b" onClick={copy}><Icon n={cp ? 'check' : 'copy'} size={12}/>{cp ? 'คัดลอกแล้ว' : 'คัดลอก'}</button><button type="button" className="mq-b" onClick={download}><Icon n="download" size={12}/>ดาวน์โหลด</button></>}</div></div>
        <div className="mq-ed"><pre className="cf-gut" ref={ogut} aria-hidden="true">{onums}</pre>
          <textarea className="cf-ta" value={out} readOnly onScroll={(e) => { if(ogut.current) ogut.current.scrollTop = e.target.scrollTop; }}
            placeholder="ผลลัพธ์ obfuscate จะขึ้นที่นี่" spellCheck={false} wrap="off"/></div>
      </section>
    </div>
    {err && <div className="cf-err err" style={{ marginTop:14 }}>{err}</div>}
  </div>);
}
