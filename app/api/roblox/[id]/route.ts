import { invalidateCatalog, type Sound } from "@/lib/catalog";
import { mutateCol } from "@/lib/db";
import { err, json, readJson, str } from "@/lib/http";
import { getUser, isAdmin } from "@/lib/session";


type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(await getUser())) return err("admin_only", 403);
  const { id } = await params;
  const b = await readJson<{ name?: string; genre_id?: string }>(req, 5000);
  const r = await mutateCol<Sound[], Sound | null>("roblox_sounds", [], (list) => {
    const s = list.find((x) => x.id === id);
    if (!s) return null;
    const name = str(b?.name, 80);
    if (name) { s.name = name; s.is_custom_name = true; }
    if (b?.genre_id !== undefined) s.genre_id = str(b.genre_id, 40);
    return s;
  });
  invalidateCatalog();
  return r ? json(r) : err("not_found", 404);
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!isAdmin(await getUser())) return err("admin_only", 403);
  const { id } = await params;
  await mutateCol<Sound[], void>("roblox_sounds", [], (list) => {
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list.splice(i, 1);
  });
  invalidateCatalog();
  return new Response(null, { status: 204 });
}
