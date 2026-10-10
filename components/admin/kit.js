'use client';
import { useState, useCallback } from 'react';
import CountUp from '../CountUp';
import Icon from '../Icons';
// ชุดเครื่องมือกลางของหลังบ้าน — เรียก API / คัดลอก / การ์ดพื้นฐาน (ใช้ซ้ำทุกหน้า จะได้หน้าตาและพฤติกรรมเหมือนกัน)
export async function api(url, opt){
  try{ const r = await fetch(url, { cache:'no-store', ...opt }); return { ok:r.ok, status:r.status, data:await r.json().catch(() => null) }; }
  catch{ return { ok:false, status:0, data:null }; }
}
export const send = (url, body, method = 'POST') => api(url, { method, headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
export function useCopy(){
  const [k, setK] = useState('');
  const copy = useCallback((text, id = 'x') => { navigator.clipboard?.writeText(text); setK(id); setTimeout(() => setK(''), 1300); }, []);
  return [k, copy];
}
export const Pill = ({ tone = '', children }) => <span className={'pill ' + tone}>{children}</span>;
export function Panel({ title, sub, actions, children, className = '' }){
  return (<section className={'pn ' + className}>
    {(title || actions) && <header className="pn-h"><div className="pn-t">{title && <h2>{title}</h2>}{sub && <small>{sub}</small>}</div><span className="grow"/>{actions}</header>}
    {children}</section>);
}
// การ์ดสถิติ: ตัวเลข (number) จะนับขึ้นอัตโนมัติ · icon = id จาก components/Icons.js
export const Stat = ({ label, value, tone = '', hint, icon }) => (<div className={'ad-stat ' + tone}>
  {icon && <i className="ad-stat-ic"><Icon n={icon} size={20}/></i>}
  <div className="ad-stat-tx"><span>{label}</span><b>{typeof value === 'number' ? <CountUp to={value} ms={1400}/> : value}</b>{hint && <em>{hint}</em>}</div></div>);
export const Empty = ({ children }) => <div className="empty">{children}</div>;
// ผลทดสอบ 1 บรรทัด: ✓ / ✕ / … พร้อมรายละเอียด
export const Result = ({ ok, pending, label, detail }) => (
  <div className={'rs ' + (pending ? 'pend' : ok ? 'ok' : 'no')}><i>{pending ? '…' : ok ? '✓' : '✕'}</i><div><b>{label}</b>{detail && <small>{detail}</small>}</div></div>);
export const fmtDate = (t) => t ? new Date(t).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' }) : '—';
