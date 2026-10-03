// POST /api/vault/:code/unlock — เปิดดูโค้ดบนเว็บ (ใส่รหัสผ่านถ้ามี) จำกัด 8 ครั้ง/5 นาที ต่อ IP+โค้ด
import { err, json, readJson, str } from "@/lib/http";
import { getIp } from "@/lib/ip";
import { LIMITS } from "@/lib/limits";
import { verifyPassword } from "@/lib/password";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { addView, getVault } from "@/lib/vault";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rl = await rateLimit(LIMITS.unlockFail, `${getIp(req.headers)}:${code}`);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const v = await getVault(code);
  if (!v) return err("not_found", 404);
  if (v.password_hash && v.password_salt) {
    const b = await readJson<{ password?: string }>(req, 2000);
    const pw = str(b?.password, 100);
    if (!pw || !verifyPassword(pw, v.password_salt, v.password_hash)) return err("wrong_password", 401);
  }
  await addView(code);
  return json({ title: v.title, script: v.script });
}
