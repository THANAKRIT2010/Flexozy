// lib/ip.ts — ดึง IP ผู้ใช้จริง (Vercel / reverse proxy ใส่ให้ใน header)
export function getIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

// ใช้ผูก captcha token กับ "เครือข่าย" ไม่ใช่ IP เป๊ะๆ (มือถือสลับ IP ในวง /24 หรือ /64 บ่อย)
export function ipPrefix(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":"); // IPv6 ~ /64
  const p = ip.split(".");
  return p.length === 4 ? p.slice(0, 3).join(".") : ip; // IPv4 /24
}
