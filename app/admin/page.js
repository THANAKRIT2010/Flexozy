import { notFound } from 'next/navigation';
import { getUser } from '@/lib/session';
import AdminPanel from '@/components/AdminPanel';
export const dynamic='force-dynamic';
export const metadata = { title:'Flexozy Admin' };
export default async function Admin(){
  const u = await getUser();
  if(!u?.is_admin) notFound(); // คนทั่วไปได้ 404 ปกติ ไม่รู้ว่ามีหน้านี้
  return <AdminPanel user={u}/>;
}
