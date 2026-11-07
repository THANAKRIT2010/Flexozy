'use client';
import { useState } from 'react';
import { Modal } from '../Ui';
import { send } from './kit';
// ตัวแก้โค้ดต้นฉบับของแมพ — ต้องใส่รหัสผ่านก่อน (ตรวจที่เซิร์ฟเวอร์ ทุกครั้งที่โหลด/บันทึก/กู้คืน)
const SRC = { url:'โค้ดต้นฉบับจาก Script URL', edited:'โค้ดที่คุณแก้ไว้ (ใช้งานอยู่)', empty:'ยังไม่มีโค้ด' };
export default function MapCodeEditor({ game, onClose, onChanged }){
  const [pw, setPw] = useState(''), [code, setCode] = useState(null), [src, setSrc] = useState(''), [orig, setOrig] = useState('');
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(null);
  const call = async (method, body) => { setBusy(true); setMsg(null); const r = await send('/api/admin/games/code', { id:game.id, password:pw, ...body }, method); setBusy(false); return r; };
  async function unlock(e){ e?.preventDefault(); const r = await call('POST', {});
    if(!r.ok) return setMsg({ t:r.data?.error || 'เปิดไม่สำเร็จ', bad:true });
    setCode(r.data.code); setOrig(r.data.code); setSrc(r.data.source); }
  async function save(){ const r = await call('PUT', { code });
    if(!r.ok) return setMsg({ t:r.data?.error || 'บันทึกไม่สำเร็จ', bad:true });
    setOrig(code); setSrc('edited'); setMsg({ t:`บันทึกแล้ว (${(r.data.bytes / 1024).toFixed(1)} KB) — ผู้เล่นจะได้โค้ดนี้ทันที` }); onChanged?.(); }
  async function restore(){ if(!confirm('ล้างโค้ดที่แก้ แล้วกลับไปใช้ต้นฉบับจาก Script URL?')) return;
    const r = await call('DELETE', {}); if(!r.ok) return setMsg({ t:r.data?.error || 'ไม่สำเร็จ', bad:true });
    onChanged?.(); await unlock(); setMsg({ t:'กู้คืนต้นฉบับแล้ว' }); }
  return (<Modal onClose={onClose}>
    <div className="mce">
      <h3 className="mdl-t">แก้โค้ดแมพ · {game.name}</h3>
      {code === null ? <form onSubmit={unlock} className="mce-lock">
        <p>เปิดดู/แก้โค้ดต้นฉบับของแมพนี้ ต้องใส่รหัสผ่านก่อน</p>
        <input type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder="รหัสผ่าน" autoComplete="off"/>
        <button className="btn" disabled={busy || !pw}>{busy ? 'กำลังตรวจสอบ…' : 'ปลดล็อก'}</button>
        {msg && <div className="note bad">{msg.t}</div>}
      </form> : <>
        <div className="mce-top"><span className="pill">{SRC[src] || ''}</span><small>{code.split('\n').length.toLocaleString()} บรรทัด · {code.length.toLocaleString()} ตัวอักษร</small></div>
        <textarea className="mce-ta" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} wrap="off"/>
        {msg && <div className={'note' + (msg.bad ? ' bad' : '')}>{msg.t}</div>}
        <div className="mce-act">
          <button className="btn" disabled={busy || code === orig || !code.trim()} onClick={save}>{busy ? 'กำลังบันทึก…' : 'บันทึกโค้ด'}</button>
          {src === 'edited' && <button className="btn ghost" disabled={busy} onClick={restore}>กู้คืนต้นฉบับ</button>}
          <button className="btn ghost" onClick={onClose}>ปิด</button>
        </div>
        <small className="mce-n">ใช้กับโหมดที่ต้องมี key (ค่าเริ่มต้น) · โค้ดที่บันทึกจะถูกส่งแทน Script URL</small>
      </>}
    </div>
  </Modal>);
}
