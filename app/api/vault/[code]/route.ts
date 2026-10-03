// GET (เจ้าของ/แอดมิน: ดูโค้ดเพื่อแก้ไข) / PUT แก้ไข / DELETE ลบ
import { API_HOST, SITE_URL } from "@/lib/env";
import { err, json, readJson, str } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { getUser, isAdmin } from "@/lib/session";
import { deleteVault, getVault, publicMeta, saveVault } from "@/lib/vault";

type Ctx = { params: Promise<{ code: string }> };
const MAX_SCRIPT = 200_000;

async function load(params: Ctx["params"]) {
  const u = await getUser();
  if (!u) return { error: err("not_authenticated", 401) } as const;
  const v = await getVault((await params).code);
  if (!v) return { error: err("not_found", 404) } as const;
  if (v.owner_id !== u.id && !isAdmin(u)) return { error: err("forbidden", 403) } as const;
  return { u, v } as const;
}

export async function GET(_: Request, { params }: Ctx) {
  const r = await load(params);
  if ("error" in r) return r.error;
  const { v } = r;
  return json({ title: v.title, image: v.image || "", script: v.script, owner_name: v.owner_name, has_password: !!v.password_hash });
}

export async function PUT(req: Request, { params }: Ctx) {
  const r = await load(params);
  if ("error" in r) return r.error;
  const { v } = r;
  const b = await readJson<{ title?: string; script?: string; password?: string; remove_password?: boolean; image?: string }>(req, MAX_SCRIPT + 5000);
  if (!b) return err("payload_too_large", 413);

  if (b.title !== undefined) v.title = str(b.title, 120) || "Untitled";
  if (b.image !== undefined) { const s = str(b.image, 500); v.image = /^https:\/\/[^\s]+$/i.test(s) ? s : ""; }
  if (b.script !== undefined) {
    const s = typeof b.script === "string" ? b.script.slice(0, MAX_SCRIPT) : "";
    if (!s.trim()) return err("empty_script", 400);
    v.script = s;
  }
  if (b.remove_password) { v.password_hash = null; v.password_salt = null; }
  else if (str(b.password, 100)) { const h = hashPassword(str(b.password, 100)); v.password_hash = h.hash; v.password_salt = h.salt; }

  await saveVault(v);
  return json(publicMeta(v, API_HOST, SITE_URL));
}

export async function DELETE(_: Request, { params }: Ctx) {
  const r = await load(params);
  if ("error" in r) return r.error;
  await deleteVault(r.v);
  return new Response(null, { status: 204 });
}
