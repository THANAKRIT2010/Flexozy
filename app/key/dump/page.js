import { redirect } from 'next/navigation';
// ย้ายระบบ key ไปที่ app.flexozy.xyz แล้ว — ลิงก์เก่า /key/dump ส่งต่อไปที่นั่น
export default function Page(){ redirect('https://app.flexozy.xyz/'); }
