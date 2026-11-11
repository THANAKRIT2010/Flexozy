// ห่อทุกหน้า: mount ใหม่ทุกครั้งที่เปลี่ยนเส้นทาง → เล่นอนิเมชันเด้งเข้า (พื้นหลังคลื่นอยู่ใน layout เพื่อไม่ให้รีโหลดทุกหน้า)
export default function Template({ children }){ return <div className="x-pg">{children}</div>; }
