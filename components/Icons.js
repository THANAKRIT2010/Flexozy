// ไอคอนเส้น (24x24) ใช้ทั้งหน้าแรกและหลังบ้าน — id ต้องตรงกับ ICON_IDS ใน lib/site.js
const P = {
  play:'M8 5.5v13l11-6.5z',
  link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  key:'M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-2h2l2.2-2.2A4 4 0 0 1 15 7z',
  map:'M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7zM9 4v13M15 7v13',
  users:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4.2a4 4 0 0 1 0 7.6M22 21a7 7 0 0 0-4.5-6.5',
  bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
  shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  box:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  chart:'M4 20V10M10 20V4M16 20v-7M22 20H2',
  heart:'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  crown:'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  download:'M12 3v12M7 11l5 5 5-5M4 21h16',
  home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  palette:'M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11a1 1 0 1 0 0-.01M10 7.5a1 1 0 1 0 0-.01M14.5 7.5a1 1 0 1 0 0-.01',
  arrow:'M5 12h14M13 6l6 6-6 6',
  menu:'M4 7h16M4 12h16M4 17h16',
  plus:'M12 5v14M5 12h14',
  up:'M12 19V5M6 11l6-6 6 6',
  down:'M12 5v14M6 13l6 6 6-6',
  trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  logout:'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10',
};
export const ICON_NAMES = Object.keys(P);
export default function Icon({ n, size = 20, ...r }){
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...r}><path d={P[n] || P.star}/></svg>;
}
