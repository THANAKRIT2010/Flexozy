import { Redis } from "@upstash/redis";

// รองรับทั้งชื่อ env var แบบเก่า (KV_REST_API_*, ที่ Vercel เซ็ตให้อัตโนมัติเมื่อผูก
// Upstash integration แบบ "KV" ผ่าน Marketplace) และชื่อแบบใหม่ (UPSTASH_REDIS_REST_*)
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  // จะ error ตอน runtime เท่านั้น (ไม่ทำให้ build พัง) พร้อมข้อความบอกวิธีแก้
  console.warn(
    "[flexozy] ไม่พบค่า KV_REST_API_URL / KV_REST_API_TOKEN — " +
      "ไปที่ Vercel Dashboard > Storage > เพิ่ม Upstash for Redis แล้วเชื่อมกับโปรเจกต์นี้"
  );
}

export const redis = new Redis({ url, token });
