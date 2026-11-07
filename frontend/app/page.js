import Home from '@/components/Home';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
export const dynamic = 'force-dynamic';
// หน้าแรก: เรนเดอร์ฝั่งเซิร์ฟเวอร์ — ข้อความ/ตัวเลขสถิติมาจากหลังบ้าน (/admin/appearance); ถ้าอ่านค่าไม่ได้จะซ่อนช่องสถิติ ไม่ทำให้หน้าล่ม
export default async function Page(){
  let site; try{ const s = await publicSite(); site = { hero:s.cfg.hero, countMs:s.cfg.countMs, stats:s.stats }; }
  catch{ site = { hero:DEFAULT_SITE.hero, countMs:DEFAULT_SITE.countMs, stats:[] }; }
  return <Home site={site}/>;
}
