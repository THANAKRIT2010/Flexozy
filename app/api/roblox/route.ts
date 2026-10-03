// GET /api/roblox — รายการเพลงในคลัง (สาธารณะ) / POST — แอดมินเพิ่มเพลงเข้าคลัง
import { getCatalog, invalidateCatalog, type Sound } from "@/lib/catalog";
import { mutateCol } from "@/lib/db";
import { err, json, readJson, str } from "@/lib/http";
import { extractId, getRobloxInfo, UpstreamBusy } from "@/lib/roblox";
import { getUser, isAdmin } from "@/lib/session";


export async function GET() {
  const list = (await getCatalog()).slice().sort((a, b) => b.added_at - a.added_at);
  return json(list, 200, { "Cache-Control": "private, max-age=15" });
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!isAdmin(u)) return err("admin_only", 403);
  const b = await readJson<{ id?: string; name?: string; genre_id?: string }>(req, 5000);
  const id = extractId(b?.id);
  if (!id) return err("invalid_id", 400);

  let info;
  try { info = await getRobloxInfo(id); } catch (e) { return err(e instanceof UpstreamBusy ? "busy" : "roblox_unreachable", 503); }
  if (!info.found) return err("not_found", 404);
  if (!info.is_audio) return err("not_audio_asset", 422);

  const custom = str(b?.name, 80);
  const entry: Sound = {
    id, name: custom || info.name, original_name: info.name, is_custom_name: !!custom, creator: info.creator, thumbnail: info.thumbnail,
    verified: true, genre_id: str(b?.genre_id, 40), added_by: u!.id, added_by_name: u!.name, added_at: Math.floor(Date.now() / 1000),
  };
  const ok = await mutateCol<Sound[], boolean>("roblox_sounds", [], (list) => {
    if (list.some((s) => s.id === id)) return false;
    list.push(entry);
    return true;
  });
  invalidateCatalog();
  return ok ? json(entry, 201) : err("already_in_catalog", 409);
}
