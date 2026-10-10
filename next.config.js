/** @type {import('next').NextConfig} */
const security = [
  { key:'X-Content-Type-Options', value:'nosniff' },
  { key:'X-Frame-Options', value:'DENY' },                                   // กัน clickjacking หน้า admin
  { key:'Referrer-Policy', value:'strict-origin-when-cross-origin' },
  { key:'Permissions-Policy', value:'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key:'Strict-Transport-Security', value:'max-age=63072000; includeSubDomains; preload' },
  { key:'Cross-Origin-Opener-Policy', value:'same-origin' },
  { key:'Content-Security-Policy', value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];
module.exports = {
  poweredByHeader:false,
  reactStrictMode:true,
  async headers(){ return [{ source:'/:path*', headers:security }]; },
};
