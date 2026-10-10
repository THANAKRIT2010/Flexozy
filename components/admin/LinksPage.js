'use client';
import { useEffect, useState, useCallback } from 'react';
import LinkForm from '../LinkForm';
import { ls, failover } from '@/lib/snippets';
import { Avatar, Modal, ProfileModal, PlayersList } from '../Ui';
import { api, send, useCopy, Panel, Pill, Empty } from './kit';
export default function LinksPage(){
  const [d, setD] = useState({ stats:{ links:0, views:0, owners:0 }, links:[], hosts:[] }), [q, setQ] = useState(''), [prof, setProf] = useState(null), [pl, setPl] = useState(null), [ready, setReady] = useState(false), [cp, copy] = useCopy();
  const load = useCallback(async () => { const r = await api('/api/admin/vault'); if(r.ok) setD(r.data); setReady(true); }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (c) => { if(!confirm(`ลบลิงก์ ${c} ?`)) return; await api('/api/admin/vault/' + c, { method:'DELETE' }); load(); };
  const toggleKey = async (v) => { await send('/api/admin/vault/' + v.code, { needs_key:!v.needs_key }, 'PATCH'); load(); };
  const rows = d.links.filter(v => (v.code + v.title + (v.owner_name || '')).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <div className="ad-grid ad-g2">
      <Panel title="สร้างลิงก์ใหม่" sub="กำหนดโค้ดลิงก์เองได้"><LinkForm endpoint="/api/admin/vault" admin onCreated={load}/></Panel>
      <Panel title="ลิงก์ทั้งหมด" sub={`${rows.length} จาก ${d.links.length} · ยอดรวม ${d.stats.views.toLocaleString()}`}
        actions={<input className="search" placeholder="ค้นหาโค้ด / ชื่อ / ผู้สร้าง" value={q} onChange={e => setQ(e.target.value)}/>}>
        <div className="ad-tw"><table>
          <thead><tr><th>ลิงก์</th><th>ผู้สร้าง</th><th className="num">ยอดรัน</th><th>สถานะ</th><th style={{ textAlign:'right' }}>จัดการ</th></tr></thead>
          <tbody>
            {!ready && <tr><td colSpan={5} className="empty">กำลังโหลด…</td></tr>}
            {ready && rows.length === 0 && <tr><td colSpan={5} className="empty">{d.links.length ? 'ไม่พบลิงก์ที่ค้นหา' : 'ยังไม่มีลิงก์ — สร้างลิงก์แรกจากฟอร์มด้านซ้าย'}</td></tr>}
            {rows.map(v => <tr key={v.code}>
              <td><div className="t">{v.title}</div><div className="s">{v.code}</div></td>
              <td><button className="chip" onClick={() => setProf({ id:v.owner_id, name:v.owner_name || '-', avatar:v.owner_avatar })}><Avatar src={v.owner_avatar} name={v.owner_name} size={20}/>{v.owner_name || '-'}</button></td>
              <td className="num">{(v.views || 0).toLocaleString()}</td>
              <td><span className="tags">{v.has_password && <Pill tone="warn">ล็อกรหัส</Pill>}{v.needs_key ? <Pill tone="blue">ต้องใช้ key</Pill> : <Pill>เปิด</Pill>}</span></td>
              <td><div className="acts">
                <button className="btn ghost sm" onClick={() => copy(ls(v.raw_url), v.code)}>{cp === v.code ? 'คัดลอกแล้ว ✓' : 'Loadstring'}</button>
                {d.hosts.length > 1 && <button className="btn ghost sm" title="ลองโดเมนสำรองอัตโนมัติถ้าโดเมนหลักถูกบล็อก" onClick={() => copy(failover(d.hosts, '/raw/' + v.code), v.code + 'f')}>{cp === v.code + 'f' ? 'คัดลอกแล้ว ✓' : 'Failover'}</button>}
                <button className="btn ghost sm" onClick={() => toggleKey(v)}>{v.needs_key ? 'ปิด key' : 'บังคับ key'}</button>
                <button className="btn ghost sm" onClick={() => setPl(v.code)}>ผู้เล่น</button>
                <a className="btn ghost sm" href={`/vault/${v.code}`}>เปิด</a>
                <button className="btn danger sm" onClick={() => del(v.code)}>ลบ</button></div></td></tr>)}
          </tbody></table></div>
      </Panel>
    </div>
    {prof && <ProfileModal p={prof} links={d.links.filter(v => v.owner_id === prof.id)} onClose={() => setProf(null)} onPlayers={c => { setProf(null); setPl(c); }}/>}
    {pl && <Modal onClose={() => setPl(null)}><h3 className="mdl-t">ผู้เล่นที่รัน · {pl}</h3><PlayersList code={pl}/></Modal>}
  </>);
}
