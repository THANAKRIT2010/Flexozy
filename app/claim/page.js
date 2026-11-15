import { redirect } from 'next/navigation';
import { getUser } from '@/lib/session';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
import MyKeyPanel from '@/components/MyKeyPanel';
export const dynamic = 'force-dynamic';
// หน้า "รับคีย์" แยกต่างหากจากหน้าเว็บหลัก/แดชบอร์ดโดยสิ้นเชิง (ไม่มีแถบเมนูข้าง ไม่ใช่ view ในแดชบอร์ด) — ต้องล็อกอินก่อนถึงจะเข้าได้
export default async function ClaimPage(){
  const me = await getUser(); if(!me) redirect('/login');
  let title = DEFAULT_SITE.hero.title; try{ title = (await publicSite()).cfg.hero.title || title; }catch{}
  return (<div className="fx dz dz-land">
    <header className="dz-lbar"><a className="dz-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>{title}</b></a><a className="dz-btn" href="/">กลับไปแดชบอร์ด</a></header>
    <main style={{ maxWidth:640, margin:'0 auto', padding:'6vh 20px 60px', position:'relative', zIndex:1 }}>
      <MyKeyPanel me={me}/>
    </main>
  </div>);
}
