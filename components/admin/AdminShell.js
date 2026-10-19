'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import '../../app/admin.css';
import { Avatar } from '../Ui';
import Icon from '../Icons';
// เมนู: จัดกลุ่มตามหน้าที่ — งานประจำวัน / หน้าตาเว็บ / ระบบ  (ไอคอนมาจาก components/Icons.js)
const NAV = [
  ['งานประจำวัน', [['/admin', 'ภาพรวม', 'home'], ['/admin/links', 'ลิงก์สคริปต์', 'link'], ['/admin/keys', 'Key ผู้ใช้', 'key'], ['/admin/maps', 'แมพของ Hub', 'map']]],
  ['หน้าตาเว็บ', [['/admin/appearance', 'ธีมและสถิติ', 'palette']]],
  ['ระบบ', [['/admin/settings', 'ความปลอดภัยและระบบ', 'shield']]],
];
const TITLES = {
  '/admin':['ภาพรวม', 'สรุปสถานะระบบและกิจกรรมล่าสุด'],
  '/admin/links':['ลิงก์สคริปต์', 'สร้างลิงก์ ดูยอดรัน และจัดการลิงก์ทั้งหมด'],
  '/admin/keys':['Key ผู้ใช้', 'สร้าง เพิกถอน และรีเซ็ต HWID'],
  '/admin/maps':['แมพของ Hub', 'จัดการแมพ ดูตัวอย่าง Hub จากข้อมูลจริง และทดสอบการรัน'],
  '/admin/appearance':['ธีมและสถิติ', 'เปลี่ยนโทนสี ข้อความหน้าแรก และแก้ไขช่องแสดงสถิติ'],
  '/admin/settings':['ความปลอดภัยและระบบ', 'สถานะการตั้งค่า ชั้นป้องกัน และเครื่องมือทดสอบ'],
};
export default function AdminShell({ user, children }){
  const path = usePathname().replace(/\/$/, '') || '/admin', [t, sub] = TITLES[path] || TITLES['/admin'], [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  return (<div className="ad">
    <div className={'ad-ov' + (open ? ' open' : '')} onClick={() => setOpen(false)}/>
    <aside className={'ad-side' + (open ? ' open' : '')}>
      <div className="ad-brand"><img src="/images/flexozy-logo.png" alt=""/><div><b>Flexozy</b><small>Admin console</small></div></div>
      {NAV.map(([group, items]) => (<nav className="ad-nav" key={group}><span className="ad-group">{group}</span>
        {items.map(([h, l, i]) => <Link key={h} href={h} className={path === h ? 'on' : ''}><Icon n={i} size={18}/>{l}</Link>)}</nav>))}
      <div className="ad-sp"/>
      <a className="ad-user" href="/"><Icon n="eye" size={18}/>ดูหน้าเว็บ</a>
      <div className="ad-me"><Avatar src={user.avatar} name={user.username} size={34}/><div><b>{user.username}</b><small>แอดมิน</small></div></div>
      <a className="ad-out" href="/logout">ออกจากระบบ</a>
    </aside>
    <main className="ad-main"><div className="ad-wrap">
      <header className="ad-top">
        <button className="ad-burger" onClick={() => setOpen(true)} aria-label="เมนู"><Icon n="menu" size={20}/></button>
        <div><h1>{t}</h1><p>{sub}</p></div>
      </header>
      {children}
    </div></main>
  </div>);
}
