import './globals.css';
export const metadata = { title:'Flexozy', icons:{ icon:'/images/flexozy-logo.png' } };
export default function RootLayout({ children }){
  return (<html lang="th"><body>{children}</body></html>);
}
