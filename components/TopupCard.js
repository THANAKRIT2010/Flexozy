'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/Icons';
// เติม TOKEN ด้วยซองอั่งเปา TrueMoney: วางลิงก์ → ระบบรับซองอัตโนมัติ → TOKEN เข้าทันที
export default function TopupCard({ onDone }){
  const [info, setInfo] = useState(null), [v, setV] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [ok, setOk] = useState(null);
  const load = useCallback(() => fetch('/api/topup', { cache:'no-store' }).then(r => r.json()).then(setInfo).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  async function paste(){ try{ const t = await navigator.clipboard.readText(); if(t) setV(t.trim()); }catch{ setErr('เบราว์เซอร์ไม่ให้อ่านคลิปบอร์ด — กด Ctrl+V ในช่องแทน'); } }
  async function go(e){ e.preventDefault(); if(busy || !v.trim()) return; setBusy(true); setErr(''); setOk(null);
    try{ const r = await fetch('/api/topup/truemoney', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ voucher:v.trim() }) }), d = await r.json().catch(() => ({}));
      if(!r.ok) setErr(d.message || 'เติมไม่สำเร็จ'); else { setOk(d); setV(''); load(); onDone?.(); } }
    catch{ setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); } setBusy(false); }
  const rate = info?.rate || 100, off = info && !info.enabled;
  return (<div className="tp">
    <div className="tp-main dz-card">
      <div className="tp-h"><span className="tp-gift"><img src="/images/truemoney-gift.png" alt=""/></span><div><h3>เติม TOKEN ด้วยซอง TrueMoney</h3><p>วางลิงก์ซองอั่งเปา ระบบรับให้อัตโนมัติ ไม่มีค่าธรรมเนียม</p></div><span className="tp-rate"><Icon n="bolt" size={14}/>1 บาท = <b>{rate.toLocaleString()}</b> TOKEN</span></div>
      {off ? <div className="tp-off">ช่องทางนี้ยังไม่เปิดใช้งาน (ร้านยังไม่ได้ตั้งค่าเบอร์รับซอง)</div> :
      <form onSubmit={go}><div className="tp-in"><Icon n="link" size={17}/><input value={v} onChange={e => setV(e.target.value)} placeholder="https://gift.truemoney.com/campaign/?v=..." autoComplete="off" spellCheck={false}/><button type="button" onClick={paste} className="tp-p"><Icon n="paste" size={14}/>วาง</button></div>
        <button className="cf-go tp-go" disabled={busy || !v.trim()}><span className="cf-go-t">{busy ? <><i className="tp-sp"/>กำลังรับซอง…</> : <>เติม TOKEN<Icon n="spark" size={17}/></>}</span></button></form>}
      {err && <div className="cf-err err">{err}</div>}
      {ok && <div className="tp-ok"><span className="tp-tick"><Icon n="check" size={22}/></span><div><b>+{ok.tokens.toLocaleString()} TOKEN</b><small>จากซอง {ok.baht.toLocaleString()} บาท · คงเหลือ {ok.balance.toLocaleString()} TOKEN</small></div></div>}
      <ol className="tp-st"><li><b>1</b>สร้างซองอั่งเปาในแอป TrueMoney</li><li><b>2</b>คัดลอกลิงก์ซอง แล้ววางด้านบน</li><li><b>3</b>TOKEN เข้าทันที (ซองใช้ได้ใบละ 1 ครั้ง)</li></ol>
    </div>
    <div className="tp-hist dz-card"><h3><Icon n="chart" size={15}/>ประวัติเติมเงิน</h3>
      {!info?.history?.length ? <div className="tp-em">ยังไม่มีรายการ</div> : info.history.map((h, i) => <div className="tp-row" key={i}><span className="tp-ic"><Icon n="bolt" size={14}/></span><div><b>+{h.tokens.toLocaleString()} TOKEN</b><small>{h.baht.toLocaleString()} บาท · {h.ref} · {new Date(h.at).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' })}</small></div></div>)}
    </div>
  </div>);
}
