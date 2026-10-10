# ช่องโหว่ที่ปิด (v9)

## ร้ายแรง
1. Hub ใช้รหัสผ่านฝังในสคริปต์ (`Flexozy` / `admin`) → ตรวจ key กับเซิร์ฟเวอร์ (`/auth` scope `login`) ผูก HWID/เพิกถอนได้
2. Auto Run ทำงานก่อนยืนยัน key (ข้าม login) → เริ่มหลังผ่านการยืนยันเท่านั้น
3. ลิงก์ที่บังคับ key ยังดูซอสได้ผ่าน `/api/vault/CODE/unlock` → ปิด (เฉพาะเจ้าของ/แอดมิน)
4. Telemetry ไป `http://78.154.103.8:15218` พร้อมรหัสลับ `LUADER` ฝังในสคริปต์สาธารณะ (ส่ง userId/ชื่อ/เกมแบบ HTTP) → ลบ (ไม่มีในไฟล์ UI ที่แนบ)
5. Code Viewer ใน loader แสดงซอสที่ซ่อนไว้ → ลบ (ไม่มีในไฟล์ที่แนบ)
6. ปลอม IP ด้วย `CF-Connecting-IP` เลี่ยง rate limit / BLOCK_IPS → เชื่อเฉพาะเมื่อมาจาก IP Cloudflare จริง
7. `/bootstrap-source` เรียกตรงได้ทุกโดเมน → ปิดบนโดเมนเว็บ + token ใช้ครั้งเดียวบนโดเมน API
8. SESSION_SECRET fallback เป็น `DISCORD_CLIENT_SECRET` / ค่าเดาได้ → production ต้องตั้ง >= 32 ตัวอักษร ไม่งั้น 503

## ปานกลาง
9. Session cookie ไม่มี exp ในตัว + เทียบลายเซ็นไม่ constant-time → แก้
10. HWID ผูกแบบ read-then-write (race) → HSETNX atomic
11. views เขียนทับทั้งเอกสาร ทำให้ `needs_key` ที่เพิ่งแก้ถูกเขียนทับกลับได้ → ตัวนับแยก (HINCRBY)
12. SSRF จาก URL สคริปต์ที่แอดมินตั้ง → `lib/safeFetch.js`
13. Rate limit / nonce fail-open เมื่อ KV ล่ม → นับในหน่วยความจำแทน
14. ไม่มี rate limit เดารหัสผ่านลิงก์ / สร้างลิงก์ / ping → เพิ่มแล้ว
15. CSRF: ตรวจ Origin ทุกคำขอแก้ข้อมูล + กัน logout CSRF
16. OAuth ขอ scope `email` ที่ไม่ได้ใช้ → ตัดออก
17. Cloudflare แคช response ที่มี token → no-store ทุกชั้น
18. ไม่มี security headers → `next.config.js`
19. ชื่อแมพ/alias ลง Lua ด้วย JSON (`\uXXXX` ทำ loader พังทั้งก้อน) → `luaStr()`
20. โหมดไฟล์: `getVault('constructor')` คืน prototype → hasOwn + เขียนไฟล์ atomic

## บั๊กที่แก้
- URL Brookhaven ถูกตัด (`%E0%B%84`) โหลดไม่ได้
- ลบแมพ Blade Ball / BlockSpin ไม่ได้ (ระบบยัดกลับทุกครั้ง)
- Blade Ball ไม่ถูกตรวจจับ (ใช้ Universe ID) → จับคู่ทั้ง PlaceId และ GameId
- ตรวจแมพด้วยชื่อ: ชื่อว่างแล้วตรง "ทุกแมพ" → ต้องยาว >= 3 ตัว
- `FxApi.fetch("game", ...)` scope ผิด (โหมด key โหลดไม่ได้เลย) → `hub:ID`
- ไอคอนแมพในหลังบ้านไม่ขึ้น (Roblox ไม่เปิด CORS) → ดึงผ่านเซิร์ฟเวอร์
- ฟอร์มสร้างลิงก์ค้างถ้าไม่ได้ตั้ง Turnstile → ทางสำรอง PoW
- Lua ยิง GetProductInfo ซ้ำทุกการ์ด → แคช

## ข้อจำกัดที่ยังมี
- ลิงก์ที่ส่ง Lua รันได้ scrape ได้เสมอถ้าปลอม UA ของ executor — ทางที่กันได้จริงคือ `needs_key` / Hub แบบ key
- ไม่ได้ resolve DNS ก่อนดึงสคริปต์ (DNS rebinding) — ตั้ง `SCRIPT_HOST_ALLOW` ถ้าต้องการเข้มสุด
- Production ต้องมี Vercel KV ไม่งั้นข้อมูลอยู่ใน /tmp และหายได้
- เปลี่ยน SESSION_SECRET/รูปแบบ cookie = ทุกคนต้องล็อกอินใหม่ครั้งเดียว


# v10 — กัน dump /loader + หลังบ้านใหม่

## โจทย์
สคริปต์ `local r = game:HttpGet("https://api.flexozy.xyz/loader"); print(r)` ต้องได้ข้อมูลที่ "ใช้ต่อไม่ได้"

## ชั้นป้องกันที่เพิ่ม
1. **ซีล /loader** (`lib/seal.js`) — response เหลือ guard + ตัวถอดรหัสสั้น + ข้อมูลที่ถูกสลับ ไม่มีโดเมน/token/ตารางเกม/ชื่อ endpoint (ทดสอบถอดกลับใน Lua จริงได้ตรงทุกไบต์)
2. **token ผูก IP** (`lib/bootToken.js`) — เอา token ที่ dump ได้ไปใช้จาก IP อื่นได้ 403 + บันทึกเหตุการณ์
3. **ตัวนับ loader ที่ไม่ถูกใช้** (`lib/loaderProtection.js`) — ผู้ใช้จริงดึง /loader แล้วเรียก /bootstrap-source ต่อเสมอ ส่วนคน dump ดึงซ้ำโดยไม่ใช้ token เกิน `LOADER_DEBT_MAX` ใน 10 นาที = แบน `LOADER_BAN_SEC` วินาที
4. **บันทึกเหตุการณ์** — `dump_suspect` / `token_ip_mismatch` / `token_replay` เก็บ 100 รายการล่าสุด ดูที่ `/admin/settings`

## ข้อจำกัด (พูดตรง ๆ)
ตัวถอดรหัสต้องส่งไปพร้อมข้อมูล ผู้โจมตีที่เก่งถอดข้อความที่ dump ได้เอง — แต่ได้เพียง stub สั้น ๆ ที่มี token ซึ่งใช้ซ้ำ/ใช้จากเครื่องอื่นไม่ได้ ของที่ต้องปกป้องจริง (สคริปต์แมพ) ซ่อนอยู่หลัง key + HWID ตั้งแต่ v9
ผู้ใช้หลายคนหลัง CGNAT (IP เดียวกัน) นับหนี้รวมกัน แต่ผู้ใช้จริงล้างหนี้ทุกครั้งที่โหลดสำเร็จ จึงไม่ถูกแบน

## ทดสอบจริง (รันแล้ว)
ซีลไม่มีคำสำคัญรั่ว · ผู้ใช้จริงโหลดครบวงจร 12 รอบไม่ถูกแบน · IP อื่นใช้ token = 403 · token ซ้ำ = 403 · เรียกตรง = 403 · เบราว์เซอร์/python = 403 · วนดึง 14 ครั้งไม่ใช้ token = โดนแบนตั้งแต่ครั้งที่ 11 โดยไม่กระทบ IP อื่น

## โครงสร้างหลังบ้านใหม่
`/admin` ภาพรวม · `/admin/links` ลิงก์ · `/admin/keys` key · `/admin/maps` แมพ + พรีวิว Hub จริง + ทดสอบ · `/admin/settings` ความปลอดภัยและระบบ + เครื่องมือทดสอบ
API ใหม่: `POST /api/admin/test` (resolve/script/loader/flow/key) · `GET /api/admin/security`
