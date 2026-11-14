import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Dashboard from '@/components/Dashboard';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
import { getUser } from '@/lib/session';
export const dynamic = 'force-dynamic';
// หน้าแรก = แดชบอร์ด: ผู้ใช้ที่ล็อกอินเห็นภาพรวม/สร้างลิงก์/ลิงก์ของฉัน/TOKEN · ผู้เยี่ยมชมเห็นหน้าแนะนำ + ปุ่มเข้าสู่ระบบ (ค่าสถิติ/ข้อความมาจาก /admin/appearance)
// v25.7: ยกเว้นที่โดเมนแอป (ตาม APP_URL เช่น app.flexozy.xyz) — ถ้ายังไม่ได้ล็อกอิน ไม่โชว์หน้าแนะนำ/ฮีโร่เลย ส่งไปหน้า /login ของโดเมนหลักแทน
// (โดเมนแอปมีไว้ให้คนที่ล็อกอินแล้วใช้งานแดชบอร์ดเท่านั้น ไม่ใช่หน้าโฆษณา) ไม่ตั้ง APP_URL ไว้ = พฤติกรรมเดิมทุกอย่าง ไม่มีผลอะไรเปลี่ยน
export default async function Page(){
  const appHost = (() => { try{ return new URL(process.env.APP_URL).host; }catch{ return ''; } })();
  if(appHost){
    const host = (await headers()).get('host') || '';
    if(host === appHost && !(await getUser())){
      const root = process.env.ROOT_URL || 'https://' + appHost.replace(/^app\./, '');
      redirect(root.replace(/\/+$/, '') + '/login');
    }
  }
  let site; try{ const s = await publicSite(); site = { hero:s.cfg.hero, countMs:s.cfg.countMs, stats:s.stats }; }
  catch{ site = { hero:DEFAULT_SITE.hero, countMs:DEFAULT_SITE.countMs, stats:[] }; }
  return <Dashboard site={site}/>;
}
