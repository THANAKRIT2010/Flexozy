import crypto from 'crypto';
import { headers } from 'next/headers';
export const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
export const checkPw = (v, pw) => !v.hash || (!!pw && crypto.timingSafeEqual(Buffer.from(hash(String(pw), v.salt)), Buffer.from(v.hash)));
export const newCode = () => crypto.randomBytes(6).toString('base64url');
export async function origin(){
  if(process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/,'');
  const h = await headers(); return `${h.get('x-forwarded-proto')||'http'}://${h.get('x-forwarded-host')||h.get('host')}`;
}
export const rawUrl = (o, code) => `${o}/raw/vault/${code}`;
