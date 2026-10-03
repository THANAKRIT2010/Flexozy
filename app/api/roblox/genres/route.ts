import { DEFAULT_GENRES, type Genre } from "@/lib/catalog";
import { mutateCol, readCol } from "@/lib/db";
import { err, json, readJson, str } from "@/lib/http";
import { getUser, isAdmin } from "@/lib/session";


export async function GET() {
  const list = await readCol<Genre[]>("roblox_genres", DEFAULT_GENRES);
  return json(list.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), 200, { "Cache-Control": "private, max-age=60" });
}

export async function POST(req: Request) {
  if (!isAdmin(await getUser())) return err("admin_only", 403);
  const b = await readJson<{ title?: string; order?: number }>(req, 3000);
  const title = str(b?.title, 40);
  if (!title) return err("missing_title", 400);
  const g: Genre = {
    id: title.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-").slice(0, 40) || `genre-${Date.now()}`,
    title, image: "", order: Number.isFinite(Number(b?.order)) ? Number(b?.order) : 999,
  };
  const ok = await mutateCol<Genre[], boolean>("roblox_genres", DEFAULT_GENRES, (list) => {
    if (list.some((x) => x.id === g.id)) return false;
    list.push(g);
    return true;
  });
  return ok ? json(g, 201) : err("already_exists", 409);
}
