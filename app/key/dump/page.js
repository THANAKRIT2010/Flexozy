import KeyPage from '@/components/KeyPage';
export const dynamic = 'force-dynamic';
export const metadata = { title:'รับคีย์ · Flexozy' };
// https://flexozy.xyz/key/dump — หน้ารับคีย์ (เดิมไม่มี route นี้ จึงขึ้น 404)
export default function Page(){ return <KeyPage/>; }
