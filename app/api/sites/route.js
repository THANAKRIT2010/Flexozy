import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import {
  isValidSubdomain,
  normalizeSubdomain,
  siteKey,
  SITES_INDEX_KEY,
  MAX_HTML_SIZE_BYTES,
  ROOT_DOMAIN,
} from "../../../lib/constants";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const subdomain = normalizeSubdomain(body.subdomain);
  const html = String(body.html || "");
  const title = String(body.title || subdomain).slice(0, 100);
  const editKey = String(body.editKey || "");

  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json({ error: "ชื่อ subdomain ไม่ถูกต้อง หรือเป็นชื่อสงวน" }, { status: 400 });
  }
  if (!html.trim()) {
    return NextResponse.json({ error: "กรุณาใส่โค้ด HTML" }, { status: 400 });
  }
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE_BYTES) {
    return NextResponse.json(
      { error: `โค้ด HTML ใหญ่เกินไป (จำกัด ${MAX_HTML_SIZE_BYTES / 1024}KB)` },
      { status: 400 }
    );
  }
  if (!editKey || editKey.length < 4) {
    return NextResponse.json(
      { error: "กรุณาตั้งรหัสแก้ไข (edit key) อย่างน้อย 4 ตัวอักษร เพื่อใช้แก้ไขเว็บนี้ในภายหลัง" },
      { status: 400 }
    );
  }

  const key = siteKey(subdomain);

  try {
    const existing = await redis.get(key);

    if (existing) {
      if (existing.editKey !== editKey) {
        return NextResponse.json(
          { error: "ชื่อนี้ถูกใช้ไปแล้ว และรหัสแก้ไขไม่ถูกต้อง" },
          { status: 403 }
        );
      }
      const updated = { ...existing, html, title, updatedAt: new Date().toISOString() };
      await redis.set(key, updated);
      return NextResponse.json({ ok: true, updated: true, url: `https://${ROOT_DOMAIN}/#${subdomain}` });
    }

    const record = {
      subdomain,
      title,
      html,
      editKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await redis.set(key, record);
    await redis.sadd(SITES_INDEX_KEY, subdomain);

    return NextResponse.json({ ok: true, created: true, url: `https://${ROOT_DOMAIN}/#${subdomain}` });
  } catch (err) {
    console.error("[flexozy] sites POST: redis error", err);
    return NextResponse.json(
      { error: "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบว่าตั้งค่า Upstash Redis แล้ว (ดู README)" },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const subdomains = (await redis.smembers(SITES_INDEX_KEY)) || [];
    const sites = await Promise.all(
      subdomains.map(async (s) => {
        const site = await redis.get(siteKey(s));
        return site ? { subdomain: site.subdomain, title: site.title, createdAt: site.createdAt } : null;
      })
    );
    return NextResponse.json(sites.filter(Boolean));
  } catch (err) {
    console.error("[flexozy] sites GET: redis error", err);
    return NextResponse.json([], { status: 200 });
  }
}
