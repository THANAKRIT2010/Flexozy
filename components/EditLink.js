'use client';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';
// v12: หน้าต่างแก้ไขลิงก์ — เต็มจอทันทีที่กด ไม่ต้องเลื่อนหาอะไร (ปุ่มบันทึกลอยอยู่ด้านล่างเสมอ)
// ใช้ createPortal ออกไปที่ document.body ตรง ๆ กัน ancestor บางหน้ามีผลต่อ position:fixed และล็อกสกอลหลังบ้านตอนเปิด
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', not_found:'ไม่พบลิงก์ หรือไม่มีสิทธิ์แก้ไข', empty_script:'โค้ดห้ามว่าง', too_large:'โค้ดยาวเกิน 200,000 ตัวอักษร', rate_limited:'แก้ไขถี่เกินไป รอสักครู่', forbidden:'เฉพาะแอดมิน', bad_request:'ข้อมูลไม่ถูกต้อง' };
export default function EditLink({ code, admin, onClose, onSaved }){
  const [mounted, setMounted] = useState(false);
  const [d, setD] = useState(null), [f, setF] = useState({ title:'', script:'', needs_key:false }), [pw, setPw] = useState(''), [rmPw, setRmPw] = useState(false), [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [ok, setOk] = useState(false);
  const taRef = useRef(null);
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden'; // ล็อกสกอลหน้าหลังไว้ขณะแก้ไข — เปิดมาเห็นตัวแก้ไขทันที ไม่มีอะไรให้เลื่อนหา
    return () => { document.documentElement.style.overflow = prevOverflow; };
  }, []);
  useEffect(() => { (async () => {
    try{ const r = await fetch('/api/vault/' + code, { cache:'no-store' }), j = await r.json().catch(() => ({}));
      if(!r.ok) return setErr(MSG[j.error] || 'โหลดไม่สำเร็จ');
      setD(j); setF({ title:j.title, script:j.script, needs_key:j.needs_key });
    }catch{ setErr('โหลดไม่สำเร็จ'); } })(); }, [code]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  async function save(){
    setBusy(true); setErr(''); setOk(false);
    const body = { title:f.title, script:f.script };
    if(pw.trim()) body.password = pw; else if(rmPw) body.password = '';
    if(admin) body.needs_key = f.needs_key;
    try{ const r = await fetch('/api/vault/' + code, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) }), j = await r.json().catch(() => ({}));
      if(!r.ok) setErr(MSG[j.error] || 'บันทึกไม่สำเร็จ');
      else { setOk(true); setPw(''); setRmPw(false); setD(x => ({ ...x, has_password:!!j.has_password })); onSaved?.(); setTimeout(() => setOk(false), 2000); }
    }catch{ setErr('บันทึกไม่สำเร็จ'); }
    setBusy(false);
  }
  if(!mounted) return null;
  const lines = f.script ? f.script.split('\n').length : 1;
  const body = (
    <div className="ed-ov" role="dialog" aria-modal="true">
      <div className="ed-box">
        <header className="ed-bar">
          <button className="ed-back" onClick={onClose} aria-label="ปิด"><Icon n="arrow" size={16} style={{ transform:'rotate(180deg)' }}/>กลับ</button>
          <div className="ed-ttl"><b>แก้ไขลิงก์</b><span>{code}</span></div>
          <span className="grow"/>
          {err && <span className="ed-err">{err}</span>}
          {ok && <span className="ed-ok"><Icon n="check" size={14}/>บันทึกแล้ว</span>}
          <button className="btn pri sm" disabled={busy || !d || !f.script.trim()} onClick={save}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </header>
        {!d && !err && <div className="ed-loading">กำลังโหลด…</div>}
        {d && <div className="ed-body">
          <div className="ed-main">
            <input className="ed-title" value={f.title} onChange={e => setF(p => ({ ...p, title:e.target.value }))} maxLength={120} placeholder="ชื่อลิงก์"/>
            <div className="ed-ed-wrap">
              <textarea ref={taRef} className="ed-ta" value={f.script} onChange={e => setF(p => ({ ...p, script:e.target.value }))} spellCheck={false} wrap="off" maxLength={200000}/>
            </div>
            <div className="ed-stats"><span>{lines.toLocaleString()} บรรทัด</span><span>{f.script.length.toLocaleString()} / 200,000</span></div>
          </div>
          <aside className="ed-side">
            <div className="ed-opt">
              <b>รหัสผ่านหน้าดูโค้ด</b>
              <small>{d.has_password ? 'ตอนนี้ตั้งไว้ — เว้นว่างด้านล่าง = ไม่เปลี่ยน' : 'ตอนนี้ไม่ได้ตั้ง'}</small>
              <div className="row" style={{ marginTop:8 }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); if(e.target.value) setRmPw(false); }} placeholder={d.has_password ? 'พิมพ์รหัสใหม่เพื่อเปลี่ยน' : 'ตั้งรหัสผ่าน'} maxLength={128} autoComplete="new-password"/>
                <button type="button" className="btn ghost sm" onClick={() => setShowPw(v => !v)}>{showPw ? 'ซ่อน' : 'แสดง'}</button>
              </div>
              {d.has_password && <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', marginTop:10, fontSize:13 }}>
                <input type="checkbox" style={{ width:'auto' }} checked={rmPw} disabled={!!pw.trim()} onChange={e => setRmPw(e.target.checked)}/>ลบรหัสผ่าน (ใครก็เปิดหน้าดูได้)</label>}
            </div>
            {admin && <div className="ed-opt">
              <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}>
                <input type="checkbox" style={{ width:'auto' }} checked={f.needs_key} onChange={e => setF(p => ({ ...p, needs_key:e.target.checked }))}/><b>บังคับใช้ key</b></label>
              <small>ต้องมี key + HWID ถึงจะได้ซอส</small>
            </div>}
          </aside>
        </div>}
        {!d && err && <div className="ed-loading err">{err}</div>}
      </div>
    </div>
  );
  return createPortal(body, document.body);
}
