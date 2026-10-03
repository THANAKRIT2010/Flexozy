import './globals.css';
import SecurityCheck from '@/components/SecurityCheck';
import ClickFx from '@/components/ClickFx';
export const metadata = { title:'Flexozy', icons:{ icon:'/images/flexozy-logo.png' } };
export default function RootLayout({ children }){
  return (<html lang="th"><body><SecurityCheck /><ClickFx />{children}</body></html>);
}
