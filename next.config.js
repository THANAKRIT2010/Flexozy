/** @type {import('next').NextConfig} */
const security = [
  { key:'X-Content-Type-Options', value:'nosniff' },
  { key:'X-Frame-Options', value:'DENY' },                                   // กัน clickjacking โดยเฉพาะหลังบ้านแอดมิน
  { key:'Referrer-Policy', value:'strict-origin-when-cross-origin' },
  { key:'Permissions-Policy', value:'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key:'Strict-Transport-Security', value:'max-age=63072000; includeSubDomains; preload' },
  { key:'Cross-Origin-Opener-Policy', value:'same-origin' },
  { key:'Cross-Origin-Resource-Policy', value:'same-origin' },               // v19: กันเว็บอื่นฝังรูป/ไฟล์ของเราข้ามไซต์
  { key:'X-Permitted-Cross-Domain-Policies', value:'none' },
  { key:'Content-Security-Policy', value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests" },
];
// v19: ข้อมูลส่วนตัว (API / หลังบ้าน / เข้า-ออกระบบ) ห้ามแคชที่เบราว์เซอร์หรือพร็อกซี
const noStore = [{ key:'Cache-Control', value:'no-store, max-age=0' }];
module.exports = {
  poweredByHeader:false,
  reactStrictMode:true,
  async headers(){ return [
    { source:'/:path*', headers:security },
    { source:'/api/:path*', headers:noStore }, { source:'/admin/:path*', headers:noStore }, { source:'/admin', headers:noStore },
    { source:'/login/:path*', headers:noStore }, { source:'/logout', headers:noStore },
  ]; },
};
