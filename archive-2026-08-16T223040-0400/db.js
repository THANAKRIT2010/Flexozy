// db.js — ที่เก็บข้อมูลแบบไฟล์ JSON แยกไฟล์ตามหมวดหมู่ชัดเจน (ไม่รวมเป็นไฟล์เดียวกัน)
// โครงสร้าง: /data/scripts.json, /data/users.json, /data/partners.json, /data/team.json,
//            /data/roblox_sounds.json, /data/vault.json, /data/settings.json, /data/stats.json
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

// ค่าเริ่มต้นของแต่ละไฟล์ (คอมเมนต์บอกโครงสร้างของแต่ละ record)
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
    // หน้าจอโหลดตอนเข้าเว็บ (ขึ้นทุกครั้งที่เข้าเว็บ ไม่ใช่ป็อปอัพโปรโมชั่น) แก้ได้จาก Admin > หน้าโหลดเว็บ
    loading_image: "/images/loading-bg.webp",
    loading_text: "กำลังโหลดหน้าเว็บ",
    // ป็อปอัพโปรโมชั่น ขึ้นหลังหน้าโหลดเว็บปิดแล้ว (แก้ไขได้ทั้งหมดจากเมนู Admin > ป็อปอัพต้อนรับ)
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

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// อ่านไฟล์เดียว พร้อมสร้างไฟล์ใหม่ถ้ายังไม่มี / กู้คืนถ้าไฟล์เสีย
function readCollection(name) {
  ensureDataDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(DEFAULTS[name], null, 2));
    return JSON.parse(JSON.stringify(DEFAULTS[name]));
  }
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    const data = JSON.parse(raw);
    // เติม field ที่ขาดหายสำหรับ object เดี่ยว เช่น settings/stats (กัน field ใหม่หายตอนอัปเดตโค้ด)
    if (!Array.isArray(DEFAULTS[name]) && typeof DEFAULTS[name] === "object") {
      let changed = false;
      for (const key of Object.keys(DEFAULTS[name])) {
        if (!(key in data)) { data[key] = DEFAULTS[name][key]; changed = true; }
      }
      if (changed) writeCollection(name, data);
    }
    return data;
  } catch (err) {
    console.error(`${name}.json corrupted, resetting to default:`, err.message);
    const fresh = JSON.parse(JSON.stringify(DEFAULTS[name]));
    writeCollection(name, fresh);
    return fresh;
  }
}

function writeCollection(name, data) {
  ensureDataDir();
  const fp = filePath(name);
  const tmp = fp + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, fp); // เขียนไฟล์ temp ก่อนแล้ว rename กันไฟล์เสียหายถ้า process ตายกลางคัน
}

// readDB() — คืนอ็อบเจ็กต์รวมทุกไฟล์ไว้ใช้งานสะดวกในโค้ดฝั่ง controller
// (แต่ที่เก็บจริงบนดิสก์ยังคงแยกเป็นไฟล์ต่างหากตามหมวดหมู่)
function readDB() {
  const combined = {};
  for (const name of COLLECTIONS) combined[name] = readCollection(name);
  return combined;
}

// เขียนกลับทุกไฟล์จากอ็อบเจ็กต์รวม (ใช้ภายใน mutate เท่านั้น)
function writeDB(data) {
  for (const name of COLLECTIONS) {
    if (name in data) writeCollection(name, data[name]);
  }
}

// mutate(fn) — อ่านข้อมูลรวมมาแก้ แล้วเขียนกลับเฉพาะไฟล์ที่เกี่ยวข้องอัตโนมัติ
// ใช้แบบเดิมทุกที่ที่เคยเรียก mutate(db => ...) ได้โดยไม่ต้องแก้ controller
function mutate(fn) {
  const data = readDB();
  const result = fn(data);
  writeDB(data);
  return result;
}

module.exports = { readDB, writeDB, mutate, readCollection, writeCollection };
