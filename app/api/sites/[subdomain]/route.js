import { NextResponse } from "next/server";
import { redis } from "../../../../lib/redis";
import { normalizeSubdomain, siteKey, SITES_INDEX_KEY } from "../../../../lib/constants";

export async function DELETE(request, context) {
  const { subdomain: rawSubdomain } = await context.params;
  const subdomain = normalizeSubdomain(rawSubdomain);
  const body = await request.json().catch(() => ({}));
  const editKey = String(body.editKey || "");

  const key = siteKey(subdomain);

  try {
    const existing = await redis.get(key);

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบเว็บไซต์นี้" }, { status: 404 });
    }
    if (existing.editKey !== editKey) {
      return NextResponse.json({ error: "รหัสแก้ไขไม่ถูกต้อง" }, { status: 403 });
    }

    await redis.del(key);
    await redis.srem(SITES_INDEX_KEY, subdomain);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[flexozy] sites DELETE: redis error", err);
    return NextResponse.json(
      { error: "เชื่อมต่อฐานข้อมูลไม่ได้ ลองใหม่อีกครั้ง" },
      { status: 503 }
    );
  }
}
