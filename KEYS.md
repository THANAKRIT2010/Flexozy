# ระบบ Key + HWID (เพิ่มใหม่)

## เปิดใช้งาน
- ลิงก์เดี่ยว (เช่น /raw/FlexozyScript): หลังบ้านแอดมิน → ปุ่ม "บังคับ key" ที่ลิงก์นั้น (หรือติ๊กตอนสร้างลิงก์) / ENV `KEY_ALL_LINKS=1` = บังคับทุกลิงก์
- Hub (/loader): เปิดเป็นค่าเริ่มต้น — URL สคริปต์ถูกซ่อน ต้องใช้ key ที่ตรวจกับเซิร์ฟเวอร์ (ไม่มีรหัสฝังในสคริปต์) ตั้ง `REQUIRE_KEY_HUB=0` เพื่อปิด
- ต้องตั้ง `SESSION_SECRET` (สตริงสุ่มยาว ๆ) บน production และใช้ Vercel KV

## ผู้ใช้
    getgenv().Key = "FX-XXXX-XXXX-XXXX-XXXX"
    loadstring(game:HttpGet("https://api.flexozy.xyz/raw/FlexozyScript"))()

## ขั้นตอนทำงาน
POST /auth {key,hwid,scope} -> token 60 วิ ใช้ครั้งเดียว ผูก key+scope -> /stage/CODE หรือ /game-script/ID ตอบซอสแบบ XOR
key ผูก HWID เครื่องแรก (เก็บเป็น hash) / เพิกถอน รีเซ็ต HWID ดูประวัติได้ที่หลังบ้าน / /auth จำกัด 30 ครั้งต่อนาทีต่อ IP และล็อกถ้าผิดเกิน 8 ครั้งใน 10 นาที

## หลังบ้าน (หน้าจอคอม)
- `/admin` ภาพรวม · `/admin/links` ลิงก์ · `/admin/keys` key · `/admin/maps` แมพ+พรีวิว+ทดสอบ · `/admin/settings` ความปลอดภัยและระบบ
- ใน Hub: Settings → **Run by Map Name** พิมพ์ชื่อแมพ/alias แล้วรันได้ แม้ Place ID ไม่ตรง
- ดู `docs/CLOUDFLARE.md`, `docs/SECURITY-CHANGES.md`

## จัดการแมพใน Admin
- เข้าหน้า `/admin` ด้วยบัญชีที่มีสิทธิ์แอดมิน
- ส่วน **จัดการแมพของ Loader** ใช้เพิ่ม/แก้ไข/ลบแมพได้จากหน้าเว็บ
- `Map Key / ID` เป็นรหัสภายในที่ไม่ซ้ำกัน เช่น `mm2` หรือ `my-new-game`
- `Place ID(s)` รองรับหลายค่า คั่นด้วย comma หรือช่องว่าง
- `ชื่ออื่นสำหรับจับคู่` ใส่ alias คั่นด้วย comma สำหรับกรณีที่ไม่มี Place ID ตรง
- `Script URL` ต้องเป็น HTTPS และควรเป็น raw script URL ที่ส่ง Lua source โดยตรง
- กด **บันทึกทั้งหมด** เพื่อเผยแพร่ค่าตั้งค่าไปยัง `/loader`, `/bootstrap-info` และ `/bootstrap-source`
- บน Vercel แนะนำให้ตั้ง `KV_REST_API_URL` เพื่อให้การตั้งค่าอยู่ถาวรข้ามการ deploy/instance; หากไม่ตั้ง จะใช้ไฟล์ `data/games.json` ในเครื่องพัฒนา และ `/tmp/games.json` บน Vercel ซึ่งอาจไม่ถาวร
- `https://api.flexozy.xyz/loader` ยังคงตอบกลับเป็น `text/plain` (Lua loader) ไม่ใช่หน้า HTML; ตัวอย่างหน้าตา Roblox เป็น preview ภายในหน้า Admin เท่านั้น

## `/loader` anti-bot protection

- `/loader`, `/bootstrap-source`, `/bootstrap-info`, and `/game-script/:id` now apply per-IP request throttling in addition to the existing browser/crawler checks.
- For shared rate limits across Vercel instances, configure Vercel KV: `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without KV, the throttle is only best-effort per running instance.
- If the domain is behind Cloudflare, add a WAF rate-limit rule for `/loader*`, `/bootstrap-*`, and `/game-script/*`, and challenge/block obvious automation. Keep the Roblox executor requests allowed.
- Important: a public URL that returns runnable Lua cannot be made impossible to scrape by headers alone; User-Agent values can be spoofed. Rate limits and Cloudflare rules reduce automated scraping but do not replace a private authentication/signature flow.
- The Admin Panel now attempts to retrieve Roblox game-icon thumbnails for each configured Place ID and shows them in the map list and preview. Maps without a valid Place ID or available Roblox thumbnail use the first letter of the map name.

## v16 (อัปเดต)
- จำคีย์ให้อัตโนมัติ: ค้นจาก getgenv().Key / key / script_key / FlexozyKey (+ _G, shared) → ไฟล์ `Flexozy_SavedKey.txt` และ `Flexozy/key.txt`; ผ่านแล้วเซฟให้เอง; เน็ตหลุดจะลองซ้ำ 3 ครั้งและไม่ลบคีย์; ถ้าเข้าไม่ได้จะใส่คีย์ในช่องให้
- HWID จริง: gethwid → get_hwid → fluxus/syn → RbxAnalyticsService ClientId (ไม่สร้างค่าปลอม); เซิร์ฟเวอร์ปฏิเสธ HWID ว่าง/ปลอม (`bad_hwid`); หลังบ้านแสดง HWID เต็ม + แหล่งที่มา (คีย์เก่าจะขึ้นค่าจริงเมื่อเจ้าของเข้าใช้ครั้งถัดไป)
- หลังบ้าน Keys: รูป/ชื่อ/ID โปรไฟล์ Roblox (เก็บได้สูงสุด 5 บัญชีต่อคีย์) และปุ่ม "ลบ key ทั้งหมด" (ต้องพิมพ์ DELETE ยืนยัน)
