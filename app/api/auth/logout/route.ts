import { clearUser } from "@/lib/session";
import { json } from "@/lib/http";

export async function POST() {
  await clearUser();
  return json({ ok: true });
}
