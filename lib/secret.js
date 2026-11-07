// รวมศูนย์ความลับ — ใช้ได้ทั้ง Edge/Node ไม่ import อะไร
// ปัญหาเดิม: ถ้าลืมตั้ง SESSION_SECRET จะ fallback เป็น DISCORD_CLIENT_SECRET (ใช้กุญแจซ้ำ) หรือค่า 'dev_secret_change_me' ที่เดาได้
// ใหม่: production ต้องตั้ง SESSION_SECRET ≥ 32 ตัวอักษร ไม่งั้น fail-closed (503) พร้อมข้อความบอกชัด
const DEV = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
export class SecretError extends Error { constructor(){ super('SESSION_SECRET is missing or shorter than 32 characters'); this.name = 'SecretError'; } }
export function SECRET(){
  const s = process.env.SESSION_SECRET || '';
  if(s.length >= 32) return s;
  if(process.env.NODE_ENV === 'production') throw new SecretError();
  return s || DEV; // dev: สุ่มต่อ process (session หายเมื่อรีสตาร์ท — ปกติสำหรับ dev)
}
export const secretReady = () => (process.env.SESSION_SECRET||'').length >= 32;
