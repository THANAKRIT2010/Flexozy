import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Dashboard from '@/components/Dashboard';
import MyKeyPanel from '@/components/MyKeyPanel';
import { publicSite, DEFAULT_SITE } from '@/lib/site';
import { getUser } from '@/lib/session';
export const dynamic = 'force-dynamic';
// v25.10: โดเมนแอป (ตาม APP_URL เช่น app.flexozy.xyz) ทั้งโดเมน = หน้า "รับคีย์" เท่านั้น ไม่ใช่แดชบอร์ด ไม่มีแถบเมนูข้าง
// ยังไม่ได้ล็อกอิน → เด้งไปหน้า /login ของโดเมนหลัก · ล็อกอินแล้ว → เห็นหน้ารับคีย์ตรงนี้เลยที่ "/" ไม่ต้องผ่าน /claim หรือแดชบอร์ด
// โดเมนหลัก (ไม่ตรงกับ APP_URL หรือไม่ได้ตั้ง APP_URL ไว้) ยังเป็นแดชบอร์ด/หน้าแนะนำตัวตามเดิมทุกอย่าง ไม่กระทบ
export default async function Page(){
  const appHost = (() => { try{ return new URL(process.env.APP_URL).host; }catch{ return ''; } })();
  if(appHost){
    const host = (await headers()).get('host') || '';
    if(host === appHost){
      const me = await getUser();
      if(!me){
        const root = process.env.ROOT_URL || 'https://' + appHost.replace(/^app\./, '');
        redirect(root.replace(/\/+$/, '') + '/login');
      }
      let title = DEFAULT_SITE.hero.title; try{ title = (await publicSite()).cfg.hero.title || title; }catch{}
      return (<div className="fx dz dz-land">
        <header className="dz-lbar"><a className="dz-brand" href="/"><img src="/images/flexozy-logo.png" alt=""/><b>{title}</b></a><a href="/logout" className="dz-btn"><span>ออกจากระบบ</span></a></header>
        <main style={{ maxWidth:640, margin:'0 auto', padding:'6vh 20px 60px', position:'relative', zIndex:1 }}>
          <MyKeyPanel me={me}/>
        </main>
      </div>);
    }
  }
  let site; try{ const s = await publicSite(); site = { hero:s.cfg.hero, countMs:s.cfg.countMs, stats:s.stats }; }
  catch{ site = { hero:DEFAULT_SITE.hero, countMs:DEFAULT_SITE.countMs, stats:[] }; }
  return <Dashboard site={site}/>;
}
