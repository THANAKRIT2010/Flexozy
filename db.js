// db.js — ที่เก็บข้อมูลจริงบน Vercel KV (Redis) แทนไฟล์ JSON เดิม
// **เหตุผลที่ย้าย**: Vercel serverless functions รันบน read-only filesystem เขียนไฟล์ (data/*.json) ไม่ได้เลย
// ต้องเปิดใช้งาน "Vercel KV" ก่อน: ไปที่โปรเจกต์บน vercel.com → แท็บ Storage → Create Database → เลือก KV
// จากนั้น Vercel จะผูก env vars (KV_REST_API_URL, KV_REST_API_TOKEN, ...) ให้อัตโนมัติ ไม่ต้องตั้งเอง
const { kv } = require("@vercel/kv");

// ค่าเริ่มต้นของแต่ละ collection (คอมเมนต์บอกโครงสร้างของแต่ละ record) — เหมือนเดิมทุกประการ ไม่เปลี่ยนโครงสร้างข้อมูล
const DEFAULTS = {
  scripts: [],   // { id, title, game, image, script, key_system, author, author_id, author_avatar, likes, liked_by: [], comments: [], created_at }
  users: {},     // discord_id -> full profile cache (avatar_decoration, banner, badges, ...)
  partners: [],  // { discord_id, username, avatar, description, discord_invite }
  team: [],      // { discord_id, username, handle, avatar, avatar_decoration, role, bio, order, added_at } — ชื่อ/รูปดึงจาก Discord ด้วย discord_id อัตโนมัติ
  roblox_sounds: [], // { id, name, original_name, is_custom_name, creator, thumbnail, verified, genre_id, added_by, added_by_name, added_at }
  vault: [],     // { code, title, script, password_hash, password_salt, owner_id, owner_name, views, created_at }
  webhooks: [],  // { id, name, url, events: ['all'] หรือ ['script_new','vault_new',...], created_at }
  reports: [],   // { id, type: 'script'|'vault'|'user', target_id, target_label, reason, reporter_id, reporter_name, status: 'open'|'resolved'|'dismissed', created_at }
  bans: [],      // { discord_id, username, reason, banned_by, banned_by_name, banned_at }
  favorites: {}, // discord_id -> [{ id, name, thumbnail, added_at }]  (รายการโปรด Roblox ID)
  daily_stats: {}, // 'YYYY-MM-DD' -> จำนวนคนเข้าเว็บ (นับ 1 ครั้ง/เซสชัน/วัน) ใช้ทำกราฟ วันนี้/รายเดือน/รายปี
  categories: [], // { id, title, subtitle, image, link, order }
  roblox_genres: [
    { id: "loud", title: "เพลงดัง", image: "", order: 1 },
    { id: "sweet", title: "เพลงเพราะ", image: "", order: 2 },
    { id: "soft", title: "เพลงเบา", image: "", order: 3 },
    { id: "sfx", title: "SFX", image: "", order: 4 },
  ], // { id, title, image, order }
  settings: {    // ตั้งค่าเว็บที่แอดมินแก้ได้จากหน้า Admin
    site_name: "Luader HUB",
    tagline: "ศูนย์รวมสคริปต์ Roblox ที่เชื่อถือได้",
    logo_url: "",
    discord_invite: "",
    hero_note: "",
    loading_image: "/images/loading-bg.webp",
    loading_text: "กำลังโหลดหน้าเว็บ",
    popup_enabled: false,
    popup_image: "",
    popup_title: "แจก CODE ฟรี",
    popup_code: "WELCOME",
    popup_desc: "รับไปเลย เครดิตฟรีในเว็บไซต์",
    popup_button_text: "ดูเพิ่มเติม",
    popup_button_link: "",
  },
  stats: { total_views: 0 },
};

const COLLECTIONS = Object.keys(DEFAULTS);

// prefix กัน key ชนกับโปรเจกต์อื่นถ้า KV database เดียวกันถูกใช้ร่วมกันในอนาคต
const kvKey = (name) => `flexozy:${name}`;

// cache สั้นๆ ระดับ process (ใช้ได้เฉพาะตอน serverless instance ยัง warm อยู่) กันยิง KV ซ้ำถี่เกินไปในคำขอใกล้ๆ กัน
const cache = new Map(); // name -> { data, ts }
const CACHE_MS = 2000;

// อ่าน collection เดียว พร้อมสร้างค่าเริ่มต้นถ้ายังไม่มีใน KV / เติม field ที่ขาดหายหลังอัปเดตโค้ด
async function readCollection(name) {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.ts < CACHE_MS) return JSON.parse(JSON.stringify(cached.data));

  let data = await kv.get(kvKey(name));
  if (data === null || data === undefined) {
    data = JSON.parse(JSON.stringify(DEFAULTS[name]));
    await kv.set(kvKey(name), data);
  } else if (!Array.isArray(DEFAULTS[name]) && typeof DEFAULTS[name] === "object") {
    // เติม field ที่ขาดหายสำหรับ object เดี่ยว เช่น settings/stats (กัน field ใหม่หายตอนอัปเดตโค้ด)
    let changed = false;
    for (const key of Object.keys(DEFAULTS[name])) {
      if (!(key in data)) { data[key] = DEFAULTS[name][key]; changed = true; }
    }
    if (changed) await kv.set(kvKey(name), data);
  }

  cache.set(name, { data, ts: Date.now() });
  return data;
}

async function writeCollection(name, data) {
  await kv.set(kvKey(name), data);
  cache.set(name, { data, ts: Date.now() });
}

// readDB() — คืนอ็อบเจ็กต์รวมทุก collection ไว้ใช้งานสะดวกในโค้ดฝั่ง controller (เหมือนเดิม แต่ตอนนี้เป็น async แล้ว)
async function readDB() {
  const entries = await Promise.all(
    COLLECTIONS.map(async (name) => [name, await readCollection(name)])
  );
  return Object.fromEntries(entries);
}

// เขียนกลับทุก collection จากอ็อบเจ็กต์รวม (ใช้ภายใน mutate เท่านั้น)
async function writeDB(data) {
  await Promise.all(
    COLLECTIONS.filter((name) => name in data).map((name) => writeCollection(name, data[name]))
  );
}

// mutate(fn) — อ่านข้อมูลรวมมาแก้ แล้วเขียนกลับให้อัตโนมัติ
// *** สำคัญ: ตอนนี้เป็น async แล้ว ทุกที่ที่เรียกต้องใส่ await mutate(...) ***
async function mutate(fn) {
  const data = await readDB();
  const result = await fn(data);
  await writeDB(data);
  return result;
}

module.exports = { readDB, writeDB, mutate, readCollection, writeCollection };
