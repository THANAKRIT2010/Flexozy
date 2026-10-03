import { getUser, isAdmin } from "@/lib/session";
import { json } from "@/lib/http";

export async function GET() {
  const u = await getUser();
  return json(u ? { authenticated: true, user: { ...u, is_admin: isAdmin(u) } } : { authenticated: false });
}
