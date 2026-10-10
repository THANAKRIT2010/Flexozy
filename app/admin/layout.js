import { notFound } from 'next/navigation';
import { getUser } from '@/lib/session';
import AdminShell from '@/components/admin/AdminShell';
export const dynamic = 'force-dynamic';
export const metadata = { title:'Flexozy Admin', robots:{ index:false, follow:false } };
// ทุกหน้าใต้ /admin: คนที่ไม่ใช่แอดมินได้ 404 ปกติ (ไม่รู้ว่ามีหน้านี้)
export default async function AdminLayout({ children }){
  const u = await getUser(); if(!u?.is_admin) notFound();
  return <AdminShell user={u}>{children}</AdminShell>;
}
