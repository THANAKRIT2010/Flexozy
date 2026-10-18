'use client';
import { useEffect, useState } from 'react';
// v11: หน้าต่างแก้ไขลิงก์ — แก้โค้ด / ชื่อ / เปลี่ยนหรือลบรหัสผ่าน (แอดมินแก้ "บังคับ key" ได้ด้วย)
// ใช้ได้ทั้งหน้าหลัก (ลิงก์ของฉัน) และหลังบ้าน — เรียก /api/vault/CODE (เจ้าของหรือแอดมิน)
const MSG = { not_authenticated:'กรุณาเข้าสู่ระบบก่อน', not_found:'ไม่พบลิงก์ หรือไม่มีสิทธิ์แก้ไข', empty_script:'โค้ดห้ามว่าง', too_large:'โค้ดยาวเกิน 200,000 ตัวอักษร', rate_limited:'แก้ไขถี่เกินไป รอสักครู่', forbidden:'เฉพาะแอดมิน', bad_request:'ข้อมูลไม่ถูกต้อง' };
export default function EditLink({ code, admin, onClose, onSaved }){
  const [d, setD] = useState(null), [f, setF] = useState({ title:'', script:'', needs_key:false }), [pw, setPw] = useState(''), [rmPw, setRmPw] = useState(false), [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [ok, setOk] = useState(false);
  useEffect(() => { (async () => {
    try{ const r = await fetch('/api/vault/' + code, { cache:'no-store' }), j = await r.json().catch(() => ({}));
      if(!r.ok) return setErr(MSG[j.error] || 'โหลดไม่สำเร็จ');
      setD(j); setF({ title:j.title, script:j.script, needs_key:j.needs_key });
    }catch{ setErr('โหลดไม่สำเร็จ'); } })(); }, [code]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  async function save(){
    setBusy(true); setErr(''); setOk(false);
    const body = { title:f.title, script:f.script };
    if(pw.trim()) body.password = pw; else if(rmPw) body.password = ''; // เว้นว่าง = ไม่เปลี่ยนรหัสผ่าน
    if(admin) body.needs_key = f.needs_key;
    try{ const r = await fetch('/api/vault/' + code, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) }), j = await r.json().catch(() => ({}));
      if(!r.ok) setErr(MSG[j.error] || 'บันทึกไม่สำเร็จ');
      else { setOk(true); setPw(''); setRmPw(false); setD(x => ({ ...x, has_password:!!j.has_password })); onSaved?.(); }
    }catch{ setErr('บันทึกไม่สำเร็จ'); }
    setBusy(false);
  }
  return (<div className="mdl" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="mdl-box" style={{ maxWidth:760 }}>
    <button className="mdl-x" onClick={onClose} aria-label="ปิด">✕</button>
    <h3 className="mdl-t">แก้ไขลิงก์ · {code}</h3>
    {!d && !err && <div className="msg">กำลังโหลด…</div>}
    {d && <>
      <label>ชื่อลิงก์</label>
      <input value={f.title} onChange={e => setF(p => ({ ...p, title:e.target.value }))} maxLength={120}/>
      <label>โค้ด Lua ({f.script.length.toLocaleString()} / 200,000)</label>
      <textarea value={f.script} onChange={e => setF(p => ({ ...p, script:e.target.value }))} spellCheck={false} wrap="off" maxLength={200000} style={{ minHeight:260 }}/>
      <label>รหัสผ่านหน้าดูโค้ด — {d.has_password ? 'ตอนนี้ตั้งไว้ (เว้นว่าง = ไม่เปลี่ยน)' : 'ตอนนี้ไม่ได้ตั้ง'}</label>
      <div className="row"><input type={showPw ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); if(e.target.value) setRmPw(false); }} placeholder={d.has_password ? 'พิมพ์รหัสใหม่เพื่อเปลี่ยน' : 'พิมพ์เพื่อตั้งรหัสผ่าน'} maxLength={128} autoComplete="new-password"/>
        <button type="button" className="btn ghost" onClick={() => setShowPw(v => !v)}>{showPw ? 'ซ่อน' : 'แสดง'}</button></div>
      {d.has_password && <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}><input type="checkbox" style={{ width:'auto' }} checked={rmPw} disabled={!!pw.trim()} onChange={e => setRmPw(e.target.checked)}/>ลบรหัสผ่าน (ใครก็เปิดหน้าดูได้)</label>}
      {admin && <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}><input type="checkbox" style={{ width:'auto' }} checked={f.needs_key} onChange={e => setF(p => ({ ...p, needs_key:e.target.checked }))}/>บังคับใช้ key (ต้องมี key + HWID ถึงได้ซอส)</label>}
      {err && <div className="err">{err}</div>}{ok && <div style={{ color:'#6ee7a0', fontSize:13, marginTop:10 }}>บันทึกแล้ว ✓ — ลิงก์เดิมใช้โค้ดใหม่ทันที</div>}
      <button className="btn w" disabled={busy || !f.script.trim()} onClick={save}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
    </>}
    {!d && err && <div className="err">{err}</div>}
  </div></div>);
}
