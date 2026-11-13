import Icon from '@/components/Icons';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
export const dynamic = 'force-dynamic';
// หน้าล็อกอินของจริง (ก่อนหน้านี้กดปุ่มแล้วเด้งไป Discord ทันทีไม่มีหน้านี้) — อธิบายว่าล็อกอินแล้วจะได้อะไรบ้าง
// ก่อนส่งต่อไปที่ /login/discord (ตัวจริงที่ยิง OAuth ไปหา Discord)
export default async function LoginPage(){
  let title = DEFAULT_SITE.hero.title; try{ title = (await publicSite()).cfg.hero.title || title; }catch{}
  return (<div className="fx dz dz-land">
    <header className="dz-lbar"><a className="dz-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>{title}</b></a></header>
    <main className="dz-hero" style={{ maxWidth:560, paddingTop:'8vh' }}>
      <span className="dz-badge"><i/>เข้าสู่ระบบ</span>
      <h1 style={{ fontSize:'clamp(32px,6vw,52px)' }}>เข้าสู่ระบบด้วย Discord</h1>
      <p>ล็อกอินครั้งแรก ระบบจะเข้าร่วมเซิร์ฟเวอร์ Discord ของเราให้อัตโนมัติ และออกคีย์ใช้งานฟรีให้ทันที</p>
      <a className="dz-btn pri lg" href="/login/discord" style={{ background:'#5865F2', borderColor:'#5865F2' }}><Icon n="users" size={18}/>เข้าสู่ระบบด้วย Discord</a>
      <ul className="dz-feat" style={{ marginTop:40 }}>
        <li><Icon n="users" size={18}/><b>เข้าร่วม Discord อัตโนมัติ</b><span>ไม่ต้องกดรับคำเชิญเอง ระบบเพิ่มเข้าเซิร์ฟเวอร์ให้ทันทีตอนล็อกอิน</span></li>
        <li><Icon n="key" size={18}/><b>รับคีย์ฟรีทันที</b><span>ใช้เปิด Hub ที่ต้องใช้ key ได้เลย ดูคีย์ของคุณได้ที่หน้า "คีย์ของคุณ"</span></li>
        <li><Icon n="link" size={18}/><b>จัดการลิงก์ของคุณ</b><span>ฝากสคริปต์ แก้ไข ลบ และดูสถิติการรันทั้งหมดได้จากแดชบอร์ด</span></li>
      </ul>
    </main>
  </div>);
}
