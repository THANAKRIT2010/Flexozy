// GET /api/roblox/check/:id — เช็ค Roblox ID (ผ่านแคช + รวมคำขอซ้ำ + เพดานรวม ดู lib/roblox.ts)
import { err, json } from "@/lib/http";
import { extractId, getRobloxInfo, UpstreamBusy } from "@/lib/roblox";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = extractId((await params).id);
  if (!id) return err("invalid_id", 400);
  try {
    const info = await getRobloxInfo(id);
    if (!info.found) return err("not_found", 404);
    return json(info, 200, { "Cache-Control": "private, max-age=60" });
  } catch (e) {
    if (e instanceof UpstreamBusy) return err("busy", 503, { retry_after: 10 });
    return err("roblox_unreachable", 502);
  }
}
