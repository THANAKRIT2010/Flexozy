import { API_HOST, SITE_URL } from "@/lib/env";
import { err, json } from "@/lib/http";
import { getVault, publicMeta, viewsFor } from "@/lib/vault";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const v = await getVault((await params).code);
  if (!v) return err("not_found", 404);
  const [withViews] = await viewsFor([v]);
  return json(publicMeta(withViews, API_HOST, SITE_URL));
}
