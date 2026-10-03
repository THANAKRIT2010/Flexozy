// lib/roblox.ts — คุยกับ Roblox API แบบ "ถนอม" ไม่ให้เซิร์ฟเวอร์เราโดน Roblox ลิมิต:
//   1) แคชผลเช็ค ID ใน Redis (เจอ 1 ชม. / ไม่เจอ 5 นาที) → ID เดิมถูกถามกี่รอบก็ไม่ยิง Roblox ซ้ำ
//   2) รวมคำขอซ้ำที่กำลังบินอยู่ (in-flight coalescing) → 1,000 คนเช็ค ID เดียวพร้อมกัน = ยิง Roblox 1 ครั้ง
//   3) เพดานรวมทั้งระบบ (ROBLOX_UPSTREAM_BUDGET) → ถ้าเกิน ตอบ busy แทนการยิงต่อ
import { getStore } from "./db";
import { ROBLOX_UPSTREAM_BUDGET } from "./limits";

const HEADERS = { "User-Agent": "Roblox/WinInet", Accept: "application/json" };
export const AUDIO_TYPE_ID = 3;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export const extractId = (input: unknown) => {
  const m = String(input ?? "").match(/(\d{5,15})/);
  return m ? m[1] : null;
};

export type RobloxInfo = { found: true; id: string; name: string; creator: string; is_audio: boolean; thumbnail: string | null } | { found: false };

export class UpstreamBusy extends Error {}

async function upstreamSlot() {
  const bucket = Math.floor(Date.now() / 1000 / ROBLOX_UPSTREAM_BUDGET.windowSec);
  try {
    const { count } = await getStore().incr(`rbx-upstream:${bucket}`, ROBLOX_UPSTREAM_BUDGET.windowSec * 2);
    if (count > ROBLOX_UPSTREAM_BUDGET.max) throw new UpstreamBusy();
  } catch (e) {
    if (e instanceof UpstreamBusy) throw e;
  }
}

async function rbxFetch(url: string, init: RequestInit = {}, timeout = 8000) {
  await upstreamSlot();
  return fetch(url, { ...init, headers: { ...HEADERS, ...(init.headers || {}) }, signal: AbortSignal.timeout(timeout), cache: "no-store" });
}

async function fetchInfoUncached(id: string): Promise<RobloxInfo> {
  let name = "", creator = "", typeId: number | undefined;
  try {
    const r = await rbxFetch(`https://economy.roblox.com/v2/assets/${id}/details`);
    if (r.ok) {
      const d = await r.json();
      if (d?.Name) {
        name = d.Name;
        creator = d.Creator?.Name || "";
        typeId = d.AssetTypeId;
      }
    }
  } catch (e) {
    if (e instanceof UpstreamBusy) throw e;
  }
  if (!name) {
    try {
      const r = await rbxFetch(`https://catalog.roblox.com/v1/catalog/items/${id}/details?itemType=Asset`);
      if (r.ok) {
        const d = await r.json();
        if (d?.name) {
          name = d.name;
          creator = d.creatorName || "";
          typeId = d.assetType?.id ?? d.assetType;
        }
      }
    } catch (e) {
      if (e instanceof UpstreamBusy) throw e;
    }
  }
  if (!name) return { found: false };

  let thumbnail: string | null = null;
  try {
    const r = await rbxFetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=150x150&format=Png`, {}, 6000);
    if (r.ok) thumbnail = (await r.json())?.data?.[0]?.imageUrl || null;
  } catch {
    /* รูปไม่ได้ก็ไม่เป็นไร */
  }
  return { found: true, id, name, creator: creator || "ไม่ทราบผู้สร้าง", is_audio: typeId === AUDIO_TYPE_ID, thumbnail };
}

const inflight = new Map<string, Promise<RobloxInfo>>();

export async function getRobloxInfo(id: string): Promise<RobloxInfo> {
  const store = getStore();
  const ck = `rbx:info:${id}`;
  const cached = await store.get<RobloxInfo>(ck).catch(() => null);
  if (cached) return cached;

  let p = inflight.get(id);
  if (!p) {
    p = fetchInfoUncached(id)
      .then(async (info) => {
        await store.set(ck, info, info.found ? 3600 : 300).catch(() => {});
        return info;
      })
      .finally(() => inflight.delete(id));
    inflight.set(id, p);
  }
  return p;
}

// ---------- ไฟล์เสียง ----------
export async function downloadAudio(id: string): Promise<ArrayBuffer | null> {
  const candidates: string[] = [];
  try {
    const r = await rbxFetch(`https://assetdelivery.roblox.com/v2/assetId/${id}`, {}, 10000);
    if (r.ok) {
      const d = await r.json();
      for (const l of d?.locations || []) if (l?.location) candidates.push(l.location);
    }
  } catch (e) {
    if (e instanceof UpstreamBusy) throw e;
  }
  candidates.push(`https://assetdelivery.roblox.com/v1/asset/?id=${id}`);

  for (const url of candidates) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || !/(\.|^)(roblox\.com|rbxcdn\.com)$/i.test(u.hostname)) continue; // กัน SSRF
      const r = await rbxFetch(url, {}, 25000);
      if (!r.ok) continue;
      const len = Number(r.headers.get("content-length") || 0);
      if (len > MAX_AUDIO_BYTES) continue;
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 0 && buf.byteLength <= MAX_AUDIO_BYTES) return buf;
    } catch (e) {
      if (e instanceof UpstreamBusy) throw e;
    }
  }
  return null;
}
