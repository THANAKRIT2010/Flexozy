// scripts/migrate.mjs — ย้ายข้อมูลจากโปรเจกต์เดิม (Express) มาโครงสร้างใหม่ ใช้ได้ 2 แบบ:
//   node scripts/migrate.mjs --kv                       อ่านจาก KV เดิม (flexozy:vault ฯลฯ) → เขียนเป็นรูปแบบใหม่ในฐานข้อมูลเดียวกัน
//   node scripts/migrate.mjs --json ../Flexozy-main/data  อ่านจากไฟล์ data/*.json เดิม → เขียนเข้า KV
// ต้องตั้ง KV_REST_API_URL / KV_REST_API_TOKEN ก่อนรัน (เช่น: node --env-file=.env.local scripts/migrate.mjs --kv)
// ย้ายเฉพาะ: vault, roblox_sounds, roblox_genres, favorites (สคริปต์/ร้านค้า/เติมเงิน/ผู้ใช้อื่นๆ ไม่ถูกนำมา)
import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) { console.error("ตั้ง KV_REST_API_URL และ KV_REST_API_TOKEN ก่อน"); process.exit(1); }
const redis = new Redis({ url, token });

const args = process.argv.slice(2);
const jsonIdx = args.indexOf("--json");
const fromJson = jsonIdx >= 0 ? args[jsonIdx + 1] : null;
if (!fromJson && !args.includes("--kv")) { console.error("ใช้ --kv หรือ --json <โฟลเดอร์ data>"); process.exit(1); }

async function read(name, fallback) {
  if (fromJson) {
    const f = path.join(fromJson, `${name}.json`);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback;
  }
  return (await redis.get(`flexozy:${name}`)) ?? fallback;
}

const vaults = await read("vault", []);
let n = 0;
for (const v of vaults) {
  if (!v?.code || !v.owner_id) continue;
  const views = Number(v.views) || 0;
  await redis.set(`flexozy2:vault:${v.code}`, { ...v, views });
  await redis.sadd(`flexozy2:vault-owner:${v.owner_id}`, v.code);
  await redis.sadd("flexozy2:vault-all", v.code);
  n++;
}
console.log(`vault: ${n} รายการ`);

const sounds = await read("roblox_sounds", []);
const genres = await read("roblox_genres", []);
if (fromJson) {
  await redis.set("flexozy:roblox_sounds", sounds);
  if (genres.length) await redis.set("flexozy:roblox_genres", genres);
  const favs = await read("favorites", {});
  for (const [uid, list] of Object.entries(favs)) await redis.set(`flexozy2:fav:${uid}`, list);
  console.log(`roblox_sounds: ${sounds.length}, genres: ${genres.length}, favorites: ${Object.keys(favs).length} ผู้ใช้`);
} else {
  const favs = (await redis.get("flexozy:favorites")) || {};
  for (const [uid, list] of Object.entries(favs)) await redis.set(`flexozy2:fav:${uid}`, list);
  console.log(`roblox_sounds/genres ใช้ key เดิมต่อได้เลย, favorites: ${Object.keys(favs).length} ผู้ใช้`);
}
console.log("เสร็จแล้ว");
