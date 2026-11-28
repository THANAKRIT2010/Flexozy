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
  // สคริปต์ที่ output ใหญ่เกิน KV ไหว (ดู INLINE_LIMIT ฝั่ง server) จะได้ลิงก์ดาวน์โหลดจาก Vercel Blob
  // กลับมาแทนเนื้อไฟล์ตรงๆ — ตั้งใจไม่โหลดไฟล์ขนาดเป็นร้อย MB เข้ามาใน textarea เพราะจะทำให้แท็บค้าง/แครช
  const [downloadUrl, setDownloadUrl] = useState(''), [outLen, setOutLen] = useState(0);
  const gut = useRef(null);

  const lines = useMemo(() => (script ? script.split('\n').length : 0), [script]);
  const nums = useMemo(() => numbers(Math.min(Math.max(lines, 18), 5000)), [lines]);

  // รอผลลัพธ์ของ job ด้วยการ poll เป็นระยะ — แต่ละคำขอสั้นๆ จึงไม่มีทางถูก proxy/host/เบราว์เซอร์
  // ตัดกลางทางเหมือนตอนรอ fetch เดียวจบ (ซึ่งเคยทำให้ขึ้น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ทั้งที่จริงคือ timeout)
  const POLL_MS = 2000, MAX_WAIT_MS = 10 * 60 * 1000; // รอได้นานสุด 10 นาที ไม่ตัดเร็วเกินความจำเป็นเหมือนของเดิม
  async function poll(jobId){
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
      await new Promise((res) => setTimeout(res, POLL_MS));
      let d;
      try{
        const r = await fetch('/api/obfuscate?job=' + encodeURIComponent(jobId));
        d = await r.json().catch(() => null);
      }catch{
        continue; // เน็ตสะดุดชั่วคราวระหว่าง poll ไม่ถือว่า fail ทันที รอบหน้าลองใหม่
      }
      if (!d) continue;
      if (d.status === 'done') {
        if (d.downloadUrl) { setDownloadUrl(d.downloadUrl); setOutLen(d.outputLength || 0); }
        else setOut(d.output);
        return;
      }
      if (d.status === 'error' || d.error === 'timeout' || d.error === 'not_found') { setErr(d.message || 'obfuscate ไม่สำเร็จ'); return; }
      // status === 'pending' → รอรอบถัดไป
    }
    setErr('ใช้เวลานานเกินไป ลองใหม่อีกครั้ง');
  }

  async function run(){
    if(busy || !script.trim()) return;
    setBusy(true); setErr(''); setOut(''); setDownloadUrl(''); setOutLen(0);
    try{
      const r = await fetch('/api/obfuscate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ script }) });
      const d = await r.json().catch(() => null);
      if (!d) { setErr('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง ลองใหม่อีกครั้ง'); setBusy(false); return; }
      if (!r.ok || !d.jobId) { setErr(d.message || 'obfuscate ไม่สำเร็จ'); setBusy(false); return; }
      await poll(d.jobId);
    }catch{
      setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
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
    if (downloadUrl) { window.open(downloadUrl, '_blank'); return; }
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
        <header className="obz-head"><span>Output</span><span className="obz-count">{downloadUrl ? outLen.toLocaleString() + ' ตัวอักษร' : out ? out.length.toLocaleString() + ' ตัวอักษร' : ''}</span></header>
        <div className="obz-ed">
          {downloadUrl ? (
            // ไฟล์ใหญ่เกินกว่าจะโหลดเข้ามาแสดงในกล่องข้อความได้โดยไม่ทำให้แท็บค้าง — ให้ดาวน์โหลดแทน
            <div className="obz-empty">
              ผลลัพธ์มีขนาด {(outLen / (1024*1024)).toFixed(1)} MB ใหญ่เกินจะแสดงในนี้ได้<br/>
              <button type="button" className="obz-go" style={{ marginTop:8 }} onClick={download}>ดาวน์โหลดไฟล์ผลลัพธ์</button><br/>
              <small>ลิงก์ดาวน์โหลดจะหมดอายุใน 30 นาที</small>
            </div>
          ) : (
            <textarea className="obz-ta obz-out" value={out} readOnly wrap="soft" spellCheck={false} aria-label="ผลลัพธ์"/>
          )}
          {!out && !downloadUrl && !busy && <div className="obz-empty">ผลลัพธ์จะแสดงที่นี่</div>}
          {busy && <div className="obz-busy"><span className="obz-spin"/></div>}
        </div>
        <footer className="obz-foot">
          <span className="obz-grow"/>
          <button type="button" className="obz-ic" onClick={copy} disabled={!out} title={cp ? 'คัดลอกแล้ว' : 'คัดลอก'} aria-label="คัดลอก"><Icon n={cp ? 'check' : 'copy'} size={15}/></button>
          <button type="button" className="obz-ic" onClick={download} disabled={!out && !downloadUrl} title="ดาวน์โหลด" aria-label="ดาวน์โหลด"><Icon n="download" size={15}/></button>
        </footer>
      </section>
    </div>

    {err && <div className="obz-err" role="alert">{err}</div>}
  </div>);
}
