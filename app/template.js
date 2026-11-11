import OceanBg from '@/components/OceanBg';
// ห่อทุกหน้า: พื้นหลังคลื่น (คงอยู่) + mount ใหม่ทุกครั้งที่เปลี่ยนเส้นทางเพื่อเล่นอนิเมชันเด้งเข้า (ดู .x-pg ใน fx.css)
export default function Template({ children }){ return (<><OceanBg /><div className="x-pg">{children}</div></>); }
