'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import '../../app/admin.css';
import { Avatar } from '../Ui';
import Icon from '../Icons';
// v27: หลังบ้านใช้โครง/คลาสชุดเดียวกับแดชบอร์ด (fx dz: dz-side · dz-bar · dz-page · dz-ph) → หน้าตา สี อนิเมชัน เหมือนกันทุกจุด
// เนื้อหาข้างใน (Panel / Stat / ตาราง / ฟอร์ม) ยังใช้คลาส .ad เดิม จึงไม่ต้องแก้ทุกหน้าย่อย
const NAV = [
  [null, [['/admin', 'ภาพรวม', 'home']]],
  ['งานประจำวัน', [['/admin/links', 'ลิงก์สคริปต์', 'link'], ['/admin/keys', 'Key ผู้ใช้', 'key'], ['/admin/maps', 'แมพของ Hub', 'map']]],
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
  const path = usePathname().replace(/\/$/, '') || '/admin', [t, sub] = TITLES[path] || TITLES['/admin'], [open, setOpen] = useState(false), [menu, setMenu] = useState(false);
  const menuRef = useRef(null), icon = NAV.flatMap(g => g[1]).find(x => x[0] === path)?.[2] || 'home';
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);
  useEffect(() => {
    const c = (e) => { if(menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const k = (e) => { if(e.key === 'Escape'){ setMenu(false); setOpen(false); } };
    addEventListener('mousedown', c); addEventListener('keydown', k);
    return () => { removeEventListener('mousedown', c); removeEventListener('keydown', k); };
  }, []);
  return (<div className={'fx dz ad' + (open ? ' open' : '')}>
    <div className="dz-scrim" onClick={() => setOpen(false)}/>
    <aside className="dz-side">
      <Link className="dz-brand" href="/admin"><img src="/images/flexozy-logo.png" alt=""/><b>Flexozy</b><span className="dz-role">ADMIN</span></Link>
      <button className="dz-x" aria-label="ปิดเมนู" onClick={() => setOpen(false)}><Icon n="plus" size={17} style={{ transform:'rotate(45deg)' }}/></button>
      <nav>
        {NAV.map(([group, items]) => <div key={group || 'top'}>{group && <div className="dz-grp">{group}</div>}
          {items.map(([h, l, i]) => <Link key={h} href={h} className={path === h ? 'on' : ''}><Icon n={i} size={17}/>{l}</Link>)}</div>)}
        <div><div className="dz-grp">ลัด</div>
          <a href="/#runners"><Icon n="users" size={17}/>โปรไฟล์ผู้รัน Loader</a>
          <a href="/#bans"><Icon n="shield" size={17}/>คำขอ &amp; แบน</a>
          <a href="/#obfuscate"><Icon n="code" size={17}/>สตูดิโอ Obfuscate</a>
          <a href="/"><Icon n="arrow" size={17} style={{ transform:'rotate(180deg)' }}/>กลับแดชบอร์ด</a></div>
      </nav>
      <div className="grow"/>
      <div className="dz-me"><Avatar src={user.avatar} name={user.username} size={30}/><span><b>{user.username}</b><small>แอดมิน</small></span></div>
    </aside>

    <div className="dz-col">
      <header className="dz-bar">
        <button className="dz-ib" onClick={() => setOpen(s => !s)} aria-label="เมนู"><Icon n="menu" size={18}/></button>
        <nav className="dz-crumb"><Link href="/admin">Admin</Link><i>›</i><Icon n={icon} size={14}/><b>{t}</b></nav>
        <span className="grow"/>
        <a className="dz-btn" href="/"><Icon n="eye" size={15}/><span className="dz-hide-sm">ดูหน้าเว็บ</span></a>
        <div className="dz-dd" ref={menuRef}><button className="dz-sel" onClick={() => setMenu(m => !m)}><Avatar src={user.avatar} name={user.username} size={20}/><span>{user.username}</span><Icon n="down" size={14}/></button>
          {menu && <div className="dz-menu"><a href="/"><Icon n="chart" size={15}/>แดชบอร์ด</a><a href="/claim"><Icon n="key" size={15}/>รับคีย์ของคุณ</a><a href="/logout"><Icon n="logout" size={15}/>ออกจากระบบ</a></div>}</div>
      </header>

      <main className="dz-main"><section className="dz-page ad-page">
        <div className="dz-ph"><i className="dz-ico"><Icon n={icon} size={22}/></i><div><h1>{t}</h1><p>{sub}</p></div></div>
        {children}
      </section><footer className="dz-foot">© {new Date().getFullYear()} Flexozy · Admin console</footer></main>
    </div>
  </div>);
}
