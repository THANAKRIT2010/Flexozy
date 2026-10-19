'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';
// v13: หน้าต่างแก้ไขลิงก์ — ดีไซน์ใหม่ให้รู้สึกเหมือนเปิดไฟล์ในตัวแก้โค้ดจริง ๆ (เลขบรรทัด, จุดบอกว่ายังไม่บันทึก, Ctrl/Cmd+S)
// เต็มจอทันทีที่กด ไม่ต้องเลื่อนหาอะไร ปุ่มบันทึกอยู่แถบบนตลอด — ใช้ createPortal กัน ancestor มีผลต่อ position:fixed
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', not_found:'ไม่พบลิงก์ หรือไม่มีสิทธิ์แก้ไข', empty_script:'โค้ดห้ามว่าง', too_large:'โค้ดยาวเกิน 200,000 ตัวอักษร', rate_limited:'แก้ไขถี่เกินไป รอสักครู่', forbidden:'เฉพาะแอดมิน', bad_request:'ข้อมูลไม่ถูกต้อง' };
export default function EditLink({ code, admin, onClose, onSaved }){
  const [mounted, setMounted] = useState(false);
  const [d, setD] = useState(null), [f, setF] = useState({ title:'', script:'', needs_key:false }), [pw, setPw] = useState(''), [rmPw, setRmPw] = useState(false), [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [ok, setOk] = useState(false);
  const taRef = useRef(null), gutterRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prevOverflow; };
  }, []);
  useEffect(() => { (async () => {
    try{ const r = await fetch('/api/vault/' + code, { cache:'no-store' }), j = await r.json().catch(() => ({}));
      if(!r.ok) return setErr(MSG[j.error] || 'โหลดไม่สำเร็จ');
      setD(j); setF({ title:j.title, script:j.script, needs_key:j.needs_key });
    }catch{ setErr('โหลดไม่สำเร็จ'); } })(); }, [code]);

  const dirty = d && (f.title !== d.title || f.script !== d.script || f.needs_key !== !!d.needs_key || !!pw.trim() || rmPw);

  async function save(){
    if(busy || !d || !f.script.trim()) return;
    setBusy(true); setErr(''); setOk(false);
    const body = { title:f.title, script:f.script };
    if(pw.trim()) body.password = pw; else if(rmPw) body.password = '';
    if(admin) body.needs_key = f.needs_key;
    try{ const r = await fetch('/api/vault/' + code, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) }), j = await r.json().catch(() => ({}));
      if(!r.ok) setErr(MSG[j.error] || 'บันทึกไม่สำเร็จ');
      else { setOk(true); setPw(''); setRmPw(false); setD({ ...d, title:f.title, script:f.script, needs_key:f.needs_key, has_password:!!j.has_password }); onSaved?.(); setTimeout(() => setOk(false), 2200); }
    }catch{ setErr('บันทึกไม่สำเร็จ'); }
    setBusy(false);
  }
  useEffect(() => {
    const k = e => {
      if(e.key === 'Escape') return onClose();
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); save(); }
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [onClose, f, d, pw, rmPw, busy]);

  const lineCount = useMemo(() => (f.script ? f.script.split('\n').length : 1), [f.script]);
  const gutter = useMemo(() => Array.from({ length:lineCount }, (_, i) => i + 1).join('\n'), [lineCount]);
  const onTaScroll = () => { if(gutterRef.current && taRef.current) gutterRef.current.scrollTop = taRef.current.scrollTop; };

  if(!mounted) return null;
  const body = (
    <div className="ed-ov" role="dialog" aria-modal="true">
      <div className="ed-box">
        <header className="ed-bar">
          <button className="ed-back" onClick={onClose} aria-label="ปิด"><Icon n="arrow" size={16} style={{ transform:'rotate(180deg)' }}/><span>กลับ</span></button>
          <div className="ed-file">
            <Icon n="box" size={14}/>
            <span className="ed-file-name">{code}.lua</span>
            {dirty && <span className="ed-dot" title="มีการแก้ไขที่ยังไม่บันทึก"/>}
          </div>
          <span className="grow"/>
          {err && <span className="ed-err"><Icon n="shield" size={13}/>{err}</span>}
          {ok && <span className="ed-ok"><Icon n="check" size={14}/>บันทึกแล้ว</span>}
          <kbd className="ed-kbd">⌘S</kbd>
          <button className="btn pri sm" disabled={busy || !d || !f.script.trim()} onClick={save}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </header>
        {!d && !err && <div className="ed-loading"><span className="ed-spin"/>กำลังโหลด…</div>}
        {d && <div className="ed-body">
          <div className="ed-main">
            <input className="ed-title" value={f.title} onChange={e => setF(p => ({ ...p, title:e.target.value }))} maxLength={120} placeholder="ตั้งชื่อลิงก์"/>
            <div className="ed-ed-wrap">
              <pre ref={gutterRef} className="ed-gutter" aria-hidden="true">{gutter}</pre>
              <textarea ref={taRef} className="ed-ta" value={f.script} onChange={e => setF(p => ({ ...p, script:e.target.value }))} onScroll={onTaScroll} spellCheck={false} wrap="off" maxLength={200000}/>
            </div>
            <div className="ed-stats"><span>{lineCount.toLocaleString()} บรรทัด</span><span>{f.script.length.toLocaleString()} / 200,000 ตัวอักษร</span></div>
          </div>
          <aside className="ed-side">
            <div className="ed-opt">
              <div className="ed-opt-h"><Icon n="key" size={15}/><b>รหัสผ่านหน้าดูโค้ด</b></div>
              <small>{d.has_password ? 'ตั้งไว้แล้ว — เว้นว่างด้านล่าง = ไม่เปลี่ยน' : 'ยังไม่ได้ตั้ง — ใครมีลิงก์ก็เปิดดูโค้ดได้'}</small>
              <div className="row" style={{ marginTop:10 }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); if(e.target.value) setRmPw(false); }} placeholder={d.has_password ? 'พิมพ์รหัสใหม่เพื่อเปลี่ยน' : 'ตั้งรหัสผ่าน'} maxLength={128} autoComplete="new-password"/>
                <button type="button" className="btn ghost sm" onClick={() => setShowPw(v => !v)}>{showPw ? 'ซ่อน' : 'แสดง'}</button>
              </div>
              {d.has_password && <label className="ed-chk">
                <input type="checkbox" checked={rmPw} disabled={!!pw.trim()} onChange={e => setRmPw(e.target.checked)}/>ลบรหัสผ่าน (ใครก็เปิดหน้าดูได้)</label>}
            </div>
            {admin && <div className="ed-opt">
              <div className="ed-opt-h"><Icon n="shield" size={15}/><b>บังคับใช้ key</b></div>
              <small>ต้องมี key + HWID ถึงจะได้ซอสจริง</small>
              <label className="ed-chk" style={{ marginTop:10 }}>
                <input type="checkbox" checked={f.needs_key} onChange={e => setF(p => ({ ...p, needs_key:e.target.checked }))}/>เปิดใช้งาน</label>
            </div>}
          </aside>
        </div>}
        {!d && err && <div className="ed-loading err">{err}</div>}
      </div>
    </div>
  );
  return createPortal(body, document.body);
}
