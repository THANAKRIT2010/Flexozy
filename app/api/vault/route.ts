// POST /api/vault — สร้างลิงก์ (ต้อง login) / GET — ลิงก์ของฉัน (?all=1 สำหรับแอดมิน)
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { API_HOST, SITE_URL } from "@/lib/env";
import { err, json, readJson, str } from "@/lib/http";
import { LIMITS } from "@/lib/limits";
import { hashPassword } from "@/lib/password";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getUser, isAdmin } from "@/lib/session";
import { listVaults, publicMeta, saveVault, type Vault } from "@/lib/vault";

const MAX_SCRIPT = 200_000;
const httpsUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^https:\/\/[^\s]+$/i.test(s) ? s : "";
};

export async function GET(req: NextRequest) {
  const u = await getUser();
  if (!u) return err("not_authenticated", 401);
  const all = req.nextUrl.searchParams.get("all") === "1" && isAdmin(u);
  const list = await listVaults(all ? undefined : u.id);
  return json(list.map((v) => publicMeta(v, API_HOST, SITE_URL)));
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return err("not_authenticated", 401);
  const rl = await rateLimit(LIMITS.vaultCreate, u.id);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const b = await readJson<{ title?: string; script?: string; password?: string; image?: string }>(req, MAX_SCRIPT + 5000);
  if (!b) return err("payload_too_large", 413);
  const script = typeof b.script === "string" ? b.script.slice(0, MAX_SCRIPT) : "";
  if (!script.trim()) return err("empty_script", 400);

  let password_hash: string | null = null, password_salt: string | null = null;
  const pw = str(b.password, 100);
  if (pw) { const h = hashPassword(pw); password_hash = h.hash; password_salt = h.salt; }

  const v: Vault = {
    code: nanoid(8), title: str(b.title, 120) || "Untitled", image: httpsUrl(b.image), script,
    password_hash, password_salt, owner_id: u.id, owner_name: u.name, views: 0, created_at: Math.floor(Date.now() / 1000),
  };
  await saveVault(v);
  return json({ code: v.code, has_password: !!password_hash, raw_url: publicMeta(v, API_HOST, SITE_URL).raw_url }, 201);
}
