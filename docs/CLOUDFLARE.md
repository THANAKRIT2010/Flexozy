# ใช้งานกับ Cloudflare — ถ้าโดนบล็อกต้องยังใช้ได้

| ส่วน | ถ้า Cloudflare บล็อก | สิ่งที่ระบบทำ |
|---|---|---|
| Executor → `api.flexozy.xyz` | ได้หน้า HTML / ว่าง / error | Lua (`/loader` stub, `FxApi.auth/fetch`) ตรวจว่า response ไม่ใช่ JSON/ซอสของเรา แล้วข้ามไปโดเมนสำรองตามลำดับ (`API_FALLBACK_HOSTS`) |
| หน้าเว็บ - Turnstile | `challenges.cloudflare.com` โหลดไม่ขึ้น | หน้าตรวจสอบและฟอร์มสร้างลิงก์ใช้ proof-of-work ของเราเองแทน (`TURNSTILE_STRICT=1` = ปิดทางสำรอง) |
| เซิร์ฟเวอร์ → Turnstile siteverify | เรียกไม่ได้ | ถือเป็น unreachable ใช้ PoW ระดับยากกว่า 16 เท่าแทน |
| IP ผู้ใช้ | header `cf-connecting-ip` ปลอมได้ | เชื่อเฉพาะเมื่อผู้เชื่อมต่อจริงอยู่ในช่วง IP ของ Cloudflare (`lib/net.js`) |
| Cache | Cloudflare แคช response ที่มี token | ทุก response ของ executor ส่ง `Cache-Control: no-store` + `CDN-Cache-Control` + `Cloudflare-CDN-Cache-Control` |

## ตั้งโดเมนสำรอง
1. เพิ่มโดเมนที่ชี้มา deployment เดียวกัน เช่น `flexozy-api.vercel.app`
2. ตั้ง `API_FALLBACK_HOSTS=flexozy-api.vercel.app`
3. `/admin/settings` → คัดลอก "โค้ดโหลด Hub" (แบบ failover) ให้ผู้ใช้ — ตารางลิงก์ใน `/admin` มีปุ่ม Failover ต่อลิงก์

## กฎ Cloudflare ที่แนะนำ (Security > WAF > Custom rules)
- Skip (ข้าม Bot Fight / managed challenge / rate limiting) เมื่อ
  `http.host eq "api.flexozy.xyz" and http.request.uri.path matches "^/(loader|bootstrap-info|bootstrap-source|auth|raw|stage|ping|game-script)(/|$)"`
- ปิด Bot Fight Mode บนโดเมน API (มันท้าทาย executor) — ระบบมี rate limit + กรอง UA เองแล้ว
- Cache Rules: Bypass cache ทั้งโดเมน API
- โดเมนเว็บ `flexozy.xyz` ใช้ Managed Challenge ได้ตามปกติ

## ปิด /bootstrap-source
- `https://flexozy.xyz/bootstrap-source` (รวม `/loader`, `/bootstrap-info`, `/game-script`, `/auth`) → 404 บนโดเมนเว็บ
- โดเมน API: ต้องมี `?t=TOKEN` ที่ `/loader` ออกให้ (HMAC, 2 นาที, ใช้ครั้งเดียว) — เรียกตรงได้ 403
