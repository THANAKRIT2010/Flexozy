import { DEFAULT_GENRES, type Genre } from "@/lib/catalog";
import { mutateCol } from "@/lib/db";
import { err } from "@/lib/http";
import { getUser, isAdmin } from "@/lib/session";


export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(await getUser())) return err("admin_only", 403);
  const { id } = await params;
  await mutateCol<Genre[], void>("roblox_genres", DEFAULT_GENRES, (list) => {
    const i = list.findIndex((g) => g.id === id);
    if (i >= 0) list.splice(i, 1);
  });
  return new Response(null, { status: 204 });
}
