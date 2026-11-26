'use client';
import { useRef, useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icons';
import { copyText } from '@/components/LinkForm';
// สตูดิโอ obfuscate — พาร์เซอร์/คอมไพเลอร์/VM runtime generator เป็น JS ล้วน (lib/obf/*)
// Prettify/Minify ยังไม่ได้ต่อระบบจริง จึงปิดไว้
const MAX_IN = 300000;

function numbers(count){
  let s = '';
  for (let i = 1; i <= count; i++) s += i + '\n';
  return s;
}

export default function ObfuscateStudio({ admin = false }){
  const [script, setScript] = useState(''), [out, setOut] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [cp, setCp] = useState(false);
  const gut = useRef(null);

  const lines = useMemo(() => (script ? script.split('\n').length : 0), [script]);
  const nums = useMemo(() => numbers(Math.min(Math.max(lines, 18), 5000)), [lines]);

  async function run(){
    if(busy || !script.trim()) return;
    setBusy(true); setErr('');
    // กันค้าง: ยกเลิกฝั่ง client เองก่อนที่แพลตฟอร์ม hosting จะตัดการเชื่อมต่อแบบไม่มีคำตอบ
    // (ปรับเลขนี้ให้ต่ำกว่า maxDuration ของ route.js เสมอ เผื่อเวลาส่ง-รับข้อมูล)
    const CLIENT_TIMEOUT_MS = 55000;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
    try{
      const r = await fetch('/api/obfuscate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ script }), signal: ctrl.signal });
      const ct = r.headers.get('content-type') || '';
      if(!ct.includes('application/json')){
        // ตอบกลับไม่ใช่ JSON = ไม่ได้มาจาก route handler ของเรา (เช่นหน้า 504/502 ของ hosting เอง)
        // นี่คือ "เซิร์ฟเวอร์ประมวลผลนานเกินไป" จริงๆ ไม่ใช่เน็ตเวิร์กหลุด
        setErr(r.status === 504 || r.status === 408
          ? 'เซิร์ฟเวอร์ใช้เวลาประมวลผลนานเกินไป ลองย่อโค้ดให้สั้นลงหรือลองใหม่อีกครั้ง'
          : `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (HTTP ${r.status})`);
      }else{
        const d = await r.json();
        if(!r.ok) setErr(d.message || 'obfuscate ไม่สำเร็จ'); else setOut(d.output);
      }
    }catch(e){
      setErr(e?.name === 'AbortError'
        ? `การประมวลผลใช้เวลานานเกิน ${Math.round(CLIENT_TIMEOUT_MS / 1000)} วินาที — โค้ดอาจยาวเกินไป ลองย่อขนาดหรือแบ่งรันหลายรอบ`
        : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    }finally{
      clearTimeout(to);
    }
    setBusy(false);
  }

  // Ctrl/⌘ + Enter = รัน
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  function copy(){ copyText(out); setCp(true); setTimeout(() => setCp(false), 1200); }
  function download(){
    const blob = new Blob([out], { type:'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'obfuscated.lua'; a.click(); URL.revokeObjectURL(a.href);
  }

  return (<div className="obz">
    <div className="obz-bar">
      <div className="obz-tabs" role="tablist">
        <button type="button" role="tab" aria-selected="true" className="on">Obfuscate</button>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน">Prettify</button>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน">Minify</button>
      </div>
      <button type="button" className="obz-go" disabled={busy || !script.trim()} onClick={run}>
        {busy ? 'กำลังสร้าง…' : 'Obfuscate'}
      </button>
    </div>

    <div className="obz-deck">
      <section className="obz-pane">
        <header className="obz-head"><span>Script</span><span className="obz-count">{script.length.toLocaleString()} / {admin ? 'ไม่จำกัด' : MAX_IN.toLocaleString()}{admin && <em className="obz-adm">ADMIN</em>}</span></header>
        <div className="obz-ed">
          <pre className="obz-gut" ref={gut} aria-hidden="true">{nums}</pre>
          <textarea className="obz-ta" value={script}
            onChange={(e) => setScript(admin ? e.target.value : e.target.value.slice(0, MAX_IN))}
            onScroll={(e) => { if(gut.current) gut.current.scrollTop = e.target.scrollTop; }}
            placeholder={'print("Hello World")'} spellCheck={false} wrap="off" aria-label="โค้ดต้นฉบับ"/>
        </div>
        <footer className="obz-foot">
          <span className="obz-grow"/>
          <button type="button" className="obz-ic" onClick={() => setScript('')} disabled={!script} title="ล้าง" aria-label="ล้าง"><Icon n="trash" size={15}/></button>
        </footer>
      </section>

      <section className="obz-pane">
        <header className="obz-head"><span>Output</span><span className="obz-count">{out ? out.length.toLocaleString() + ' ตัวอักษร' : ''}</span></header>
        <div className="obz-ed">
          <textarea className="obz-ta obz-out" value={out} readOnly wrap="soft" spellCheck={false} aria-label="ผลลัพธ์"/>
          {!out && !busy && <div className="obz-empty">ผลลัพธ์จะแสดงที่นี่</div>}
          {busy && <div className="obz-busy"><span className="obz-spin"/></div>}
        </div>
        <footer className="obz-foot">
          <span className="obz-grow"/>
          <button type="button" className="obz-ic" onClick={copy} disabled={!out} title={cp ? 'คัดลอกแล้ว' : 'คัดลอก'} aria-label="คัดลอก"><Icon n={cp ? 'check' : 'copy'} size={15}/></button>
          <button type="button" className="obz-ic" onClick={download} disabled={!out} title="ดาวน์โหลด" aria-label="ดาวน์โหลด"><Icon n="download" size={15}/></button>
        </footer>
      </section>
    </div>

    {err && <div className="obz-err" role="alert">{err}</div>}
  </div>);
}
