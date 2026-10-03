import { getStore } from "@/lib/db";
import { err, json, readJson, str } from "@/lib/http";
import { getUser } from "@/lib/session";

type Fav = { id: string; name: string; thumbnail: string; added_at: number };
const key = (uid: string) => `flexozy2:fav:${uid}`;

export async function GET() {
  const u = await getUser();
  if (!u) return err("not_authenticated", 401);
  return json((await getStore().get<Fav[]>(key(u.id))) || []);
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return err("not_authenticated", 401);
  const b = await readJson<{ id?: string; name?: string; thumbnail?: string }>(req, 5000);
  const id = str(b?.id, 20);
  if (!/^\d{5,15}$/.test(id)) return err("invalid_id", 400);

  const s = getStore();
  const list = (await s.get<Fav[]>(key(u.id))) || [];
  const idx = list.findIndex((f) => f.id === id);
  let favorited = false;
  if (idx >= 0) list.splice(idx, 1);
  else {
    if (list.length >= 300) return err("favorites_full", 422);
    list.unshift({ id, name: str(b?.name, 80), thumbnail: str(b?.thumbnail, 300), added_at: Math.floor(Date.now() / 1000) });
    favorited = true;
  }
  await s.set(key(u.id), list);
  return json({ favorited, list });
}
