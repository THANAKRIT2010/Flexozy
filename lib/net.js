// ยูทิลิตี้เครือข่ายที่ใช้ได้ทั้ง Edge (middleware) และ Node — ห้าม import Node-only module
// ปัญหาเดิม: เชื่อ cf-connecting-ip ตรง ๆ → ใครก็ปลอม header นี้เพื่อเลี่ยง rate limit / BLOCK_IPS ได้เมื่อยิงเข้าต้นทางตรง
// วิธีใหม่: เชื่อ cf-connecting-ip เฉพาะเมื่อ "ผู้เชื่อมต่อจริง" (x-real-ip / XFF ที่ Vercel เขียนทับให้) อยู่ในช่วง IP ของ Cloudflare

const CF_V4 = ['173.245.48.0/20','103.21.244.0/22','103.22.200.0/22','103.31.4.0/22','141.101.64.0/18','108.162.192.0/18','190.93.240.0/20',
  '188.114.96.0/20','197.234.240.0/22','198.41.128.0/17','162.158.0.0/15','104.16.0.0/13','104.24.0.0/14','172.64.0.0/13','131.0.72.0/22'];
const CF_V6 = ['2400:cb00:','2606:4700:','2803:f800:','2405:b500:','2405:8100:','2a06:98c0:','2c0f:f248:'];

const v4n = (ip) => { const p = ip.split('.'); if(p.length!==4) return null; let n = 0;
  for(const x of p){ if(!/^\d{1,3}$/.test(x) || +x>255) return null; n = n*256 + +x; } return n; };
const CF_V4N = CF_V4.map(c => { const [b,m] = c.split('/'), base = v4n(b), size = 2 ** (32 - +m); return [base, base + size - 1]; });

export function isCloudflareIp(ip){
  ip = String(ip||'').trim().toLowerCase();
  if(ip.includes(':')) return CF_V6.some(p => ip.startsWith(p));
  const n = v4n(ip); return n !== null && CF_V4N.some(([a,b]) => n >= a && n <= b);
}
const okIp = (s) => /^[0-9a-f:.]{3,45}$/i.test(s||'');

export function clientIp(req){
  const h = req.headers;
  const peer = (h.get('x-real-ip') || (h.get('x-forwarded-for')||'').split(',').pop() || '').trim();
  const cf = (h.get('cf-connecting-ip')||'').trim();
  if(okIp(cf) && isCloudflareIp(peer)) return cf;            // มาผ่าน Cloudflare จริง
  if(okIp(peer)) return peer;                                 // ไม่ได้ผ่าน Cloudflare: ใช้ IP ที่โครงสร้างพื้นฐานบันทึกให้ ไม่เชื่อ header ที่ปลอมได้
  return '';
}

// โดเมนที่ถือเป็น "โดเมน API" (ตัวหลัก + สำรอง) — ใช้ร่วมกันทั้ง middleware, lua loader และหน้าตั้งค่า
const clean = (s) => String(s||'').split(',').map(x => x.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'')).filter(Boolean);
export const primaryApiHost = () => clean(process.env.API_HOST || (process.env.NODE_ENV==='production' ? 'api.flexozy.xyz' : ''))[0] || '';
export const fallbackApiHosts = () => clean(process.env.API_FALLBACK_HOSTS).filter(h => h !== primaryApiHost());
export const allApiHosts = () => [primaryApiHost(), ...fallbackApiHosts()].filter(Boolean);
export const webHost = () => clean(process.env.WEB_HOST || (process.env.NODE_ENV==='production' ? 'flexozy.xyz' : ''))[0] || '';

// ข้อความ/ส่วนหัวมาตรฐานของ response ฝั่ง executor — กัน CDN (Cloudflare) แคช response ที่มี token
export const EXEC_HEADERS = { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store, private', 'CDN-Cache-Control':'no-store',
  'Cloudflare-CDN-Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff' };

export const hostOf = (req) => (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].split(':')[0].trim().toLowerCase();
// true เมื่อคำขอเข้ามาทางโดเมน API (หรือยังไม่ได้ตั้งโดเมน API เช่นตอน dev) — ใช้ปิด endpoint ของ executor บนโดเมนเว็บ
export const isApiHost = (req) => { const hs = allApiHosts(); return hs.length === 0 || hs.includes(hostOf(req)); };
