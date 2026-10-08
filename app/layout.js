import './globals.css';
import ClickFx from '@/components/ClickFx';
export const metadata = { title:'Flexozy', icons:{ icon:'/images/flexozy-logo.png' } };
export default function RootLayout({ children }){
  return (<html lang="th"><body><ClickFx />{children}</body></html>);
}
