import './globals.css';
import ClickFx from '@/components/ClickFx';
import { getSite, themeVars, DEFAULT_SITE } from '@/lib/site';
export const dynamic = 'force-dynamic';
export const metadata = { title:'Flexozy', icons:{ icon:'/images/flexozy-logo.png' } };
// ธีมสีจากหลังบ้าน (/admin/appearance) ใส่เป็นตัวแปร CSS ที่ <html> — ทุกหน้าและหลังบ้านใช้ชุดเดียวกัน; อ่านไม่ได้ = ใช้ธีมเริ่มต้น เว็บไม่ล้ม
export default async function RootLayout({ children }){
  let vars; try{ vars = themeVars(await getSite()); }catch{ vars = themeVars(DEFAULT_SITE); }
  return (<html lang="th" style={vars}>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"/>
      <meta name="theme-color" content="#09090d"/>
    </head>
    <body><ClickFx />{children}</body></html>);
}
