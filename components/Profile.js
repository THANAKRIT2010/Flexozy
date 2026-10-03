'use client';
import { useState } from 'react';
export default function Profile({ user, count }){
  const [open,setOpen]=useState(false);
  return <><button type="button" className="profile-trigger" onClick={()=>setOpen(true)} aria-label="ดูโปรไฟล์">{user.avatar?<img src={user.avatar} alt=""/>:<span className="avatar-fallback">{user.username?.charAt(0)||'U'}</span>}<span>{user.username}</span><span className="profile-chevron">⌄</span></button>
    {open&&<div className="modal-backdrop" onClick={()=>setOpen(false)}><section className="profile-modal" role="dialog" aria-modal="true" aria-label="โปรไฟล์" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setOpen(false)} aria-label="ปิด">×</button><span className="eyebrow">YOUR ACCOUNT</span>
      <div className="profile-identity">{user.avatar?<img src={user.avatar} alt=""/>:<span className="avatar-fallback">{user.username?.charAt(0)||'U'}</span>}<div><h2>{user.username}</h2><p>Discord account</p></div></div>
      <div className="profile-info"><span>Discord ID</span><b>{user.id}</b></div><div className="profile-info"><span>ลิงก์ของฉัน</span><b>{count??'—'}</b></div><div className="profile-info"><span>สิทธิ์</span><b>{user.is_admin?'ผู้ดูแลระบบ':'สมาชิก'}</b></div>
      <a className="btn w" href="/logout">ออกจากระบบ ↗</a></section></div>}
  </>;
}
