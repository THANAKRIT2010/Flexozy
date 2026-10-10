'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../../app/admin.css';
import { Avatar } from '../Ui';
const I = {
  home:<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>,
  key:<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/></svg>,
  cog:<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>,
  user:<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
};
const NAV = [['/admin','ภาพรวมและลิงก์',I.home],['/admin/keys','Key ผู้ใช้',I.key],['/admin/settings','ตั้งค่าและแมพ',I.cog]];
const TITLES = { '/admin':['ภาพรวมและลิงก์','สร้างลิงก์สคริปต์ ดูยอดรัน และจัดการลิงก์ทั้งหมด'], '/admin/keys':['Key ผู้ใช้','สร้าง เพิกถอน และรีเซ็ต HWID ของ key'], '/admin/settings':['ตั้งค่าและแมพ','สถานะระบบ โดเมนสำรอง และรายการแมพของ Hub'] };
export default function AdminShell({ user, children }){
  const path = usePathname().replace(/\/$/, '') || '/admin', [t, sub] = TITLES[path] || TITLES['/admin'];
  return (<div className="ad">
    <aside className="ad-side">
      <div className="ad-brand"><img src="/images/flexozy-logo.png" alt=""/><div><b>Flexozy</b><small>Admin console</small></div></div>
      <nav className="ad-nav">{NAV.map(([h,l,i])=><Link key={h} href={h} className={path===h?'on':''}>{i}{l}</Link>)}
        <a href="/">{I.user}หน้าผู้ใช้</a></nav>
      <div className="ad-sp"/>
      <div className="ad-me"><Avatar src={user.avatar} name={user.username} size={34}/><div><b>{user.username}</b><small>แอดมิน</small></div></div>
      <a className="ad-out" href="/logout">ออกจากระบบ</a>
    </aside>
    <main className="ad-main"><div className="ad-wrap">
      <header className="ad-top"><div><h1>{t}</h1><p>{sub}</p></div></header>
      {children}
    </div></main>
  </div>);
}
