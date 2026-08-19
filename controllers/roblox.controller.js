const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const { mutate, readDB } = require("../db");
const { notifyEvent } = require("../services/notifyService");

const AUDIO_ASSET_TYPE_ID = 3;
const REQUEST_HEADERS = { "User-Agent": "Roblox/WinInet", Accept: "application/json" };
// *** สำคัญ: บน Vercel serverless เขียนไฟล์ลง public/ ไม่ได้เลย (read-only filesystem) ***
// เขียนได้แค่ os.tmpdir() (/tmp) เท่านั้น แต่ /tmp ก็ไม่การันตีว่าอยู่ข้ามคำขอ/instance
// (แคชได้ชั่วคราวระหว่าง request ที่ตกไปตก instance เดียวกัน แต่ไม่ถาวรเหมือนตอนรันบน Wispbyte/VPS)
const AUDIO_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "roblox-audio-cache")
  : path.join(__dirname, "..", "public", "audio");
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

function extractId(input) {
  const s = String(input || "").trim();
  const match = s.match(/(\d{5,})/);
  return match ? match[1] : null;
}

function localAudioPath(assetId) {
  return path.join(AUDIO_DIR, `${assetId}.mp3`);
}

async function resolveAssetLocations(assetId) {
  try {
    const res = await axios.get(`https://assetdelivery.roblox.com/v2/assetId/${assetId}`, {
      headers: REQUEST_HEADERS, timeout: 10000, validateStatus: () => true,
    });
    if (res.status === 200 && Array.isArray(res.data?.locations)) {
      return res.data.locations.map((l) => l.location).filter(Boolean);
    }
  } catch (_) {}
  return [];
}

async function downloadFromUrl(url, dest) {
  const upstream = await axios.get(url, {
    headers: REQUEST_HEADERS, responseType: "stream", timeout: 25000, maxRedirects: 5, validateStatus: (s) => s === 200,
  });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    upstream.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    upstream.data.on("error", reject);
  });
}

// ดาวน์โหลดไฟล์เสียงมาเก็บไว้ในเครื่องเราครั้งเดียว จากนั้นเล่นจากไฟล์ที่เก็บไว้ตลอด
// ไม่ต้องยิงไปหา Roblox ซ้ำอีก แม้เสียงนั้นจะถูกจำกัดสิทธิ์บนหน้าเว็บ Roblox ปกติก็ตาม
// เพราะลองหลายช่องทาง (v2 location resolver ก่อน แล้วค่อย fallback ไป v1) กว่าจะยอมแพ้
async function downloadAndCacheAudio(assetId) {
  const dest = localAudioPath(assetId);
  if (fs.existsSync(dest)) return true;

  const candidates = [...(await resolveAssetLocations(assetId)), `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`];

  for (const url of candidates) {
    try {
      await downloadFromUrl(url, dest);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return true;
    } catch (_) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }
  return false;
}

async function getAssetInfo(assetId) {
  try {
    const res = await axios.get(`https://economy.roblox.com/v2/assets/${assetId}/details`, {
      headers: REQUEST_HEADERS, timeout: 8000, validateStatus: () => true,
    });
    const d = res.data;
    if (res.status === 200 && d && d.Name) {
      return { found: true, name: d.Name, creator: d.Creator?.Name || "ไม่ทราบผู้สร้าง", assetTypeId: d.AssetTypeId };
    }
  } catch (_) {}

  try {
    const res2 = await axios.get(`https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`, {
      headers: REQUEST_HEADERS, timeout: 8000, validateStatus: () => true,
    });
    const d = res2.data;
    if (res2.status === 200 && d && d.name) {
      return { found: true, name: d.name, creator: d.creatorName || "ไม่ทราบผู้สร้าง", assetTypeId: d.assetType?.id };
    }
  } catch (_) {}

  return { found: false };
}

async function fetchRobloxAssetInfo(assetId) {
  const info = await getAssetInfo(assetId);
  if (!info.found) return { found: false };

  const isAudio = info.assetTypeId === AUDIO_ASSET_TYPE_ID;
  const usable = isAudio ? await downloadAndCacheAudio(assetId) : false;

  let thumbnail = null;
  try {
    const thumbRes = await axios.get("https://thumbnails.roblox.com/v1/assets", {
      params: { assetIds: assetId, size: "150x150", format: "Png" },
      headers: REQUEST_HEADERS, timeout: 6000, validateStatus: () => true,
    });
    thumbnail = thumbRes.data?.data?.[0]?.imageUrl || null;
  } catch (_) {
    thumbnail = null;
  }

  return { found: true, id: String(assetId), name: info.name, creator: info.creator, is_audio: isAudio, usable, thumbnail };
}

async function checkRobloxId(req, res) {
  const assetId = extractId(req.params.id);
  if (!assetId) return res.status(400).json({ error: "invalid_id" });

  try {
    const info = await fetchRobloxAssetInfo(assetId);
    if (!info.found) return res.status(404).json({ error: "not_found" });
    res.json(info);
  } catch (err) {
    res.status(502).json({ error: "roblox_unreachable" });
  }
}

async function listCatalog(req, res) {
  const db = await readDB();
  const list = db.roblox_sounds
    .slice()
    .sort((a, b) => b.added_at - a.added_at)
    .map((s) => ({ ...s, playable: fs.existsSync(localAudioPath(s.id)) }));
  res.json(list);
}

// POST /api/roblox/:id/retry-cache — ลองดาวน์โหลดเสียงที่เล่นไม่ได้ใหม่อีกครั้ง (เผื่อ Roblox แก้ปัญหาฝั่งเขาแล้ว)
async function retryCache(req, res) {
  const assetId = extractId(req.params.id);
  if (!assetId) return res.status(400).json({ error: "invalid_id" });
  const ok = await downloadAndCacheAudio(assetId);
  await mutate((db) => {
    const s = db.roblox_sounds.find((s) => s.id === assetId);
    if (s) s.cached = ok;
  });
  res.json({ playable: ok });
}

async function addToCatalog(req, res) {
  const assetId = extractId(req.body.id);
  if (!assetId) return res.status(400).json({ error: "invalid_id" });

  let info;
  try {
    info = await fetchRobloxAssetInfo(assetId);
  } catch (err) {
    return res.status(502).json({ error: "roblox_unreachable" });
  }
  if (!info.found) return res.status(404).json({ error: "not_found" });
  if (!info.is_audio) return res.status(422).json({ error: "not_audio_asset" });

  const customName = req.body.name ? String(req.body.name).trim().slice(0, 80) : "";
  const genreId = req.body.genre_id ? String(req.body.genre_id) : "";

  const entry = {
    id: info.id,
    name: customName || info.name,
    original_name: info.name,
    is_custom_name: Boolean(customName),
    creator: info.creator,
    thumbnail: info.thumbnail,
    verified: true,
    cached: info.usable,
    genre_id: genreId,
    added_by: req.session.user.discord_id,
    added_by_name: req.session.user.username,
    added_at: Math.floor(Date.now() / 1000),
  };

  const result = await mutate((db) => {
    if (db.roblox_sounds.some((s) => s.id === entry.id)) return { ok: false, code: 409 };
    db.roblox_sounds.push(entry);
    return { ok: true };
  });

  if (!result.ok) return res.status(result.code).json({ error: "already_in_catalog" });
  res.status(201).json(entry);
}

async function removeFromCatalog(req, res) {
  const assetId = req.params.id;
  await mutate((db) => {
    db.roblox_sounds = db.roblox_sounds.filter((s) => s.id !== assetId);
  });
  const localPath = localAudioPath(assetId);
  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  res.status(204).end();
}

// PATCH /api/roblox/:id — แก้ไขชื่อเพลง/หมวดหมู่ที่เพิ่มไว้แล้ว
async function updateCatalogEntry(req, res) {
  const { name, genre_id } = req.body;
  const result = await mutate((db) => {
    const s = db.roblox_sounds.find((s) => s.id === req.params.id);
    if (!s) return null;
    if (name !== undefined && String(name).trim()) {
      s.name = String(name).trim().slice(0, 80);
      s.is_custom_name = true;
    }
    if (genre_id !== undefined) s.genre_id = String(genre_id);
    return s;
  });
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
}

async function listGenres(req, res) {
  const db = await readDB();
  res.json(db.roblox_genres.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
}

async function addGenre(req, res) {
  const { title, image, order } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ error: "missing_title" });
  const genre = {
    id: String(title).trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-").slice(0, 40) || `genre-${Date.now()}`,
    title: String(title).slice(0, 40),
    image: image || "",
    order: Number.isFinite(Number(order)) ? Number(order) : 999,
  };
  const result = await mutate((db) => {
    if (db.roblox_genres.some((g) => g.id === genre.id)) return { ok: false };
    db.roblox_genres.push(genre);
    return { ok: true };
  });
  if (!result.ok) return res.status(409).json({ error: "already_exists" });
  res.status(201).json(genre);
}

async function updateGenre(req, res) {
  const { title, image, order } = req.body;
  const result = await mutate((db) => {
    const g = db.roblox_genres.find((g) => g.id === req.params.id);
    if (!g) return null;
    if (title !== undefined) g.title = String(title).slice(0, 40);
    if (image !== undefined) g.image = image;
    if (order !== undefined && Number.isFinite(Number(order))) g.order = Number(order);
    return g;
  });
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
}

async function removeGenre(req, res) {
  await mutate((db) => {
    db.roblox_genres = db.roblox_genres.filter((g) => g.id !== req.params.id);
    db.roblox_sounds.forEach((s) => { if (s.genre_id === req.params.id) s.genre_id = ""; });
  });
  res.status(204).end();
}

async function streamAudio(req, res) {
  const assetId = extractId(req.params.id);
  if (!assetId) return res.status(400).json({ error: "invalid_id" });

  const localPath = localAudioPath(assetId);
  if (fs.existsSync(localPath)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(localPath);
  }

  const cached = await downloadAndCacheAudio(assetId);
  if (cached && fs.existsSync(localPath)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(localPath);
  }

  res.status(502).json({ error: "roblox_unreachable" });
}

async function listMyFavorites(req, res) {
  const db = await readDB();
  res.json(db.favorites[req.session.user.discord_id] || []);
}

async function toggleFavorite(req, res) {
  const { id, name, thumbnail } = req.body;
  if (!id) return res.status(400).json({ error: "missing_id" });
  const userId = req.session.user.discord_id;

  const result = await mutate((db) => {
    if (!db.favorites[userId]) db.favorites[userId] = [];
    const list = db.favorites[userId];
    const idx = list.findIndex((f) => f.id === String(id));
    if (idx !== -1) {
      list.splice(idx, 1);
      return { favorited: false, list };
    }
    list.unshift({ id: String(id), name: name || "", thumbnail: thumbnail || "", added_at: Math.floor(Date.now() / 1000) });
    return { favorited: true, list };
  });
  res.json(result);
}

async function trackCopy(req, res) {
  const { id, name } = req.body;
  const user = req.session.user;
  notifyEvent("roblox_copied", {
    title: "📋 มีคนคัดลอก Roblox ID",
    description: name ? `${name} (ID: ${id})` : `ID: ${id}`,
    fields: [{ name: "คัดลอกโดย", value: user ? user.username : "ผู้เยี่ยมชม (ยังไม่ login)" }],
  }).catch((e) => console.error("notifyEvent failed:", e.message));
  res.status(204).end();
}

module.exports = { checkRobloxId, listCatalog, addToCatalog, removeFromCatalog, updateCatalogEntry, streamAudio, listMyFavorites, toggleFavorite, trackCopy, retryCache, listGenres, addGenre, updateGenre, removeGenre };
