import { NextResponse } from "next/server";
import { redis } from "../../../../lib/redis";
import { isValidSubdomain, siteKey, normalizeSubdomain } from "../../../../lib/constants";

export async function GET(request, context) {
  const { subdomain: rawSubdomain } = await context.params;
  const subdomain = normalizeSubdomain(rawSubdomain);

  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json({
      available: false,
      reason: "ชื่อไม่ถูกต้อง (ใช้ได้เฉพาะ a-z, 0-9, - และต้องยาว 3-30 ตัวอักษร หรือเป็นชื่อสงวน)",
    });
  }

  try {
    const exists = await redis.exists(siteKey(subdomain));
    return NextResponse.json({
      available: !exists,
      reason: exists ? "ชื่อนี้ถูกใช้ไปแล้ว" : null,
    });
  } catch (err) {
    console.error("[flexozy] check: redis error", err);
    return NextResponse.json(
      { available: false, reason: "เชื่อมต่อฐานข้อมูลไม่ได้ ลองใหม่อีกครั้ง" },
      { status: 503 }
    );
  }
}
