'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '../Icons';
import { api, Panel, Stat, Pill, Empty, fmtDate } from './kit';
const EV = { dump_suspect:['bad', 'สงสัยว่า dump loader'], token_ip_mismatch:['warn', 'token ถูกใช้จาก IP อื่น'], token_replay:['warn', 'ใช้ token ซ้ำ'] };
// ภาพรวม: ตัวเลขทุกช่องมาจากข้อมูลจริง (ลิงก์ / key / แมพ / สถานะระบบ / เหตุการณ์ความปลอดภัย / ช่องสถิติหน้าแรก) — ไม่มีค่าตัวอย่าง
export default function Overview(){
  const [d, setD] = useState(null);
  useEffect(() => { (async () => {
    const [v, k, g, s, sec, site] = await Promise.all(['vault', 'keys', 'games', 'status', 'security', 'site'].map(n => api('/api/admin/' + n)));
    setD({ vault:v.data, keys:Array.isArray(k.data) ? k.data : [], games:g.data?.games || [], status:s.data, sec:sec.data, site:site.data });
  })(); }, []);
  if(!d) return <Empty>กำลังโหลดข้อมูล…</Empty>;
  const { vault, keys, games, status, sec, site } = d, links = vault?.links || [], now = Date.now();
  const live = keys.filter(k => !k.revoked && !(k.exp && now > k.exp)), todo = (status?.checks || []).filter(c => !c.ok && !c.optional);
  const threats = Object.values(sec?.counts || {}).reduce((a, b) => a + b, 0);
  return (<div className="stack">
    {todo.length > 0 && <div className="banner warn"><b>ระบบยังตั้งค่าไม่ครบ {todo.length} รายการ</b><span>{todo.map(c => c.label).join(' · ')}</span><Link className="btn sm" href="/admin/settings">ไปตั้งค่า</Link></div>}
    <section className="ad-stats">
      <Stat icon="play" label="ยอดรัน/ดูทั้งหมด" value={vault?.stats.views || 0} tone="hot"/>
      <Stat icon="link" label="ลิงก์ทั้งหมด" value={links.length} hint={`${vault?.stats.owners || 0} ผู้สร้าง`}/>
      <Stat icon="key" label="Key ใช้งานได้" value={live.length} hint={`จากทั้งหมด ${keys.length}`} tone="ok"/>
      <Stat icon="map" label="แมพใน Hub" value={games.length} hint={`${games.filter(g => g.url).length} พร้อมรัน`}/>
      <Stat icon="shield" label="เหตุการณ์ป้องกัน 24 ชม." value={threats} tone={threats ? 'alert' : ''} hint={threats ? 'ดูรายละเอียดในหน้าความปลอดภัย' : 'ไม่พบความผิดปกติ'}/>
    </section>
    <div className="ad-grid ad-g2e">
      <Panel title="ลิงก์ล่าสุด" actions={<Link className="btn ghost sm" href="/admin/links">ดูทั้งหมด</Link>}>
        {links.length === 0 ? <Empty>ยังไม่มีลิงก์ — <Link href="/admin/links">สร้างลิงก์แรก</Link></Empty> :
          <ul className="list">{links.slice(0, 6).map(v => <li key={v.code}><div><b>{v.title}</b><small>{v.code} · {v.owner_name || '-'}</small></div>
            {v.needs_key ? <Pill tone="blue">ต้องใช้ key</Pill> : <Pill>เปิด</Pill>}<span className="num">{(v.views || 0).toLocaleString()}</span></li>)}</ul>}
      </Panel>
      <Panel title="เหตุการณ์ความปลอดภัยล่าสุด" actions={<Link className="btn ghost sm" href="/admin/settings">ดูทั้งหมด</Link>}>
        {!(sec?.events || []).length ? <Empty>ยังไม่มีเหตุการณ์ — ระบบทำงานปกติ</Empty> :
          <ul className="list">{sec.events.slice(0, 6).map((e, i) => { const [tone, label] = EV[e.t] || ['', e.t]; return <li key={i}><div><b>{label}</b><small>{e.ip} · {e.info}</small></div><Pill tone={tone}>{fmtDate(e.ts)}</Pill></li>; })}</ul>}
      </Panel>
    </div>
    <Panel title="สถิติที่โชว์บนหน้าแรก" sub="ตัวเลขที่ผู้เข้าเว็บเห็น — แก้ชื่อ ไอคอน หรือกำหนดตัวเลขเองได้" actions={<Link className="btn sm" href="/admin/appearance">แก้ไขสถิติ</Link>}>
      {!site?.stats?.length ? <Empty>ตอนนี้ซ่อนช่องสถิติอยู่ — เปิดได้ที่หน้า “ธีมและสถิติ”</Empty> :
        <div className="quick">{site.stats.map(s => <div className="ov-s" key={s.id}><i><Icon n={s.icon} size={18}/></i><div><small>{s.label}</small><b>{s.value.toLocaleString('th-TH')}{s.unit && <em> {s.unit}</em>}</b></div></div>)}</div>}
    </Panel>
    <Panel title="ทางลัด"><div className="quick">
      <Link href="/admin/links"><b>สร้างลิงก์สคริปต์</b><small>วางโค้ด รับ loadstring ทันที</small></Link>
      <Link href="/admin/keys"><b>ออก key ใหม่</b><small>ผูก HWID กำหนดอายุและสิทธิ์</small></Link>
      <Link href="/admin/maps"><b>เพิ่ม/ทดสอบแมพ</b><small>ดู Hub จากข้อมูลจริงและกดทดสอบ</small></Link>
      <Link href="/admin/appearance"><b>เปลี่ยนธีมสี</b><small>โทนสีหน้าเว็บและหลังบ้าน</small></Link>
    </div></Panel>
  </div>);
}
