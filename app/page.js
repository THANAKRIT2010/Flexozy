import Dashboard from '@/components/Dashboard';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
export const dynamic = 'force-dynamic';
// หน้าแรก = แดชบอร์ด: ผู้ใช้ที่ล็อกอินเห็นภาพรวม/สร้างลิงก์/ลิงก์ของฉัน/TOKEN · ผู้เยี่ยมชมเห็นหน้าแนะนำ + ปุ่มเข้าสู่ระบบ (ค่าสถิติ/ข้อความมาจาก /admin/appearance)
export default async function Page(){
  let site; try{ const s = await publicSite(); site = { hero:s.cfg.hero, countMs:s.cfg.countMs, stats:s.stats }; }
  catch{ site = { hero:DEFAULT_SITE.hero, countMs:DEFAULT_SITE.countMs, stats:[] }; }
  return <Dashboard site={site}/>;
}
