import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/session';
export const dynamic = 'force-dynamic';
// /settings → หน้าตั้งค่าหลังบ้าน (เฉพาะแอดมิน คนอื่น 404)
export default async function Settings(){ const u = await getUser(); if(!u?.is_admin) notFound(); redirect('/admin/settings'); }
