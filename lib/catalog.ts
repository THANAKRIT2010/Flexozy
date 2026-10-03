// lib/catalog.ts — ชนิดข้อมูล + แคชในหน่วยความจำของคลังเสียง Roblox (แยกออกจาก route เพราะ Next ไม่ให้ route export อย่างอื่น)
import { readCol } from "./db";

export type Sound = {
  id: string; name: string; original_name: string; is_custom_name: boolean; creator: string; thumbnail: string | null;
  verified: boolean; genre_id: string; added_by: string; added_by_name: string; added_at: number;
};
export type Genre = { id: string; title: string; image: string; order: number };

export const DEFAULT_GENRES: Genre[] = [
  { id: "loud", title: "เพลงดัง", image: "", order: 1 },
  { id: "sweet", title: "เพลงเพราะ", image: "", order: 2 },
  { id: "soft", title: "เพลงเบา", image: "", order: 3 },
  { id: "sfx", title: "SFX", image: "", order: 4 },
];

let memo: { ts: number; data: Sound[] } | null = null; // กัน Redis โดนถล่มเวลาคนเปิดหน้าพร้อมกันเยอะ
export const invalidateCatalog = () => { memo = null; };
export async function getCatalog(): Promise<Sound[]> {
  if (!memo || Date.now() - memo.ts > 15_000) memo = { ts: Date.now(), data: await readCol<Sound[]>("roblox_sounds", []) };
  return memo.data;
}
