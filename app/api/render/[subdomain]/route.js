import { redis } from "../../../../lib/redis";
import { siteKey, ROOT_DOMAIN } from "../../../../lib/constants";

export async function GET(request, context) {
  const { subdomain: rawSubdomain } = await context.params;
  const subdomain = String(rawSubdomain || "").toLowerCase();

  let site;
  try {
    site = await redis.get(siteKey(subdomain));
  } catch (err) {
    console.error("[flexozy] render: redis error", err);
    return new Response(storageErrorHtml(), {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (!site) {
    return new Response(notFoundHtml(subdomain), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(site.html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function storageErrorHtml() {
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><title>ระบบไม่พร้อมใช้งาน</title></head>
<body style="font-family:-apple-system,Segoe UI,Inter,sans-serif;text-align:center;padding:60px;color:#14181F;">
  <h1 style="font-size:22px;">เชื่อมต่อฐานข้อมูลไม่ได้</h1>
  <p style="color:#6B7280;">ยังไม่ได้ตั้งค่า Upstash Redis หรือค่า environment variables ไม่ถูกต้อง — ดูขั้นตอนใน README ของโปรเจกต์</p>
</body>
</html>`;
}

function notFoundHtml(subdomain) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ไม่พบเว็บไซต์นี้ — ${ROOT_DOMAIN}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#fff; color:#14181F; font-family:'Inter',sans-serif; padding:24px;
  }
  .box{ max-width:440px; text-align:center; }
  .code{
    font-family:'JetBrains Mono',monospace; font-size:13px; color:#9AA1AC;
    letter-spacing:.04em; margin-bottom:14px;
  }
  h1{ font-family:'Space Grotesk',sans-serif; font-size:26px; margin:0 0 12px; line-height:1.3; }
  h1 span{ color:#1E3AF5; font-family:'JetBrains Mono',monospace; font-size:20px; }
  p{ color:#6B7280; font-size:14.5px; line-height:1.6; margin:0 0 24px; }
  a.btn{
    display:inline-block; background:#1E3AF5; color:#fff; text-decoration:none;
    font-weight:600; font-size:14px; padding:12px 22px; border-radius:4px;
  }
  a.btn:hover{ background:#1730C7; }
</style>
</head>
<body>
  <div class="box">
    <div class="code">404 — ไม่พบเว็บไซต์</div>
    <h1>ยังไม่มีเว็บไซต์ชื่อ <span>${escapeHtml(subdomain)}</span> บน ${ROOT_DOMAIN}</h1>
    <p>ชื่อนี้ยังว่างอยู่ — เป็นไปได้ว่ายังไม่มีใครสร้าง หรือเว็บนี้ถูกลบไปแล้ว</p>
    <a class="btn" href="https://${ROOT_DOMAIN}/">สร้างเว็บของคุณเอง →</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
