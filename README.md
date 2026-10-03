# Flexozy (Next.js)

เหลือแค่ 2 ส่วน: **Roblox ID** (เช็ค/ฟัง/คลังเพลง/รายการโปรด) และ **Vault** (ฝากโค้ด → ลิงก์ `loadstring`)
ตัดออกทั้งหมด: หน้าแจกสคริปต์, ร้านค้า/เติมเงิน/กระเป๋า/แลกโค้ด, API เช็คสลิป, ทีมงาน/พาร์ทเนอร์, รายงาน/แบน, webhook, โหมดปิดปรับปรุง, login Google/อีเมล

## รัน
```bash
cp .env.example .env.local   # แล้วกรอกค่า
npm install
npm run dev                  # dev ใช้ Turnstile test key + หน่วยความจำแทน Redis ได้เลย
npm run build && npm start   # production
```
Production **ต้องมี** `SESSION_SECRET` (≥32 ตัว), Turnstile key และ Redis (`KV_REST_API_URL/TOKEN` — Vercel KV / Upstash)
ถ้าไม่ตั้ง `SESSION_SECRET` ระบบจะปิดทางเข้าทั้งหมด (fail-closed) ไม่ใช่เปิดโล่ง

## ย้ายข้อมูลจากโปรเจกต์เดิม
```bash
node --env-file=.env.local scripts/migrate.mjs --kv                    # จาก KV เดิม
node --env-file=.env.local scripts/migrate.mjs --json ../Flexozy-main/data   # จากไฟล์ data/*.json
```
ย้ายเฉพาะ vault, คลังเพลง, หมวดหมู่, รายการโปรด — ลิงก์ loadstring เดิมใช้ต่อได้ (Discord ID เดิมเป็นเจ้าของเหมือนเดิม) และ vault เก่าจะถูกย้ายอัตโนมัติเมื่อมีคนเปิดลิงก์

## ระบบป้องกัน (อยู่ใน `middleware.ts` + `lib/`)
| ชั้น | ทำอะไร |
|---|---|
| **ด่าน captcha** | เข้าครั้งแรกต้องผ่าน Cloudflare Turnstile → ได้ตั๋ว (คุกกี้ HMAC) อายุ 6 ชม. **ตรวจที่ Edge ก่อนถึงทุกหน้าและทุก API** ข้ามด้วยการเรียก API ตรงไม่ได้ |
| **ตั๋วผูกอุปกรณ์** | ผูกกับ User-Agent + เครือข่าย IP (/24, /64) เอาคุกกี้ไปแจกบอทอื่นไม่ได้ |
| **Rate limit ต่อ IP** | หน้าเว็บ 120/นาที · API 90/นาที · เช็ค ID 20/นาที · ไฟล์เสียง 40/นาที · verify 8/5 นาที · ลิงก์ raw 60/นาที (และ 40/นาทีต่อโค้ด) · ใส่รหัส vault ผิด 8/5 นาที — แก้ที่ `lib/limits.ts` ที่เดียว, ตอนโดนถล่มตั้ง `RL_SCALE=0.5` |
| **ปกป้อง Roblox API** | แคชผลเช็ค ID (1 ชม.), รวมคำขอซ้ำที่กำลังบินอยู่ให้เหลือ 1 ครั้ง, เพดานรวมทั้งระบบ 40 ครั้ง/10 วิ — เกินแล้วตอบ "คิวเยอะ" แทนยิงต่อ; เช็ค ID ไม่ดาวน์โหลดเสียงแล้ว (โหลดตอนกดเล่นเท่านั้น) |
| **Vault ทนโหลด** | เก็บทีละ key แทนก้อนเดียว, นับ views ด้วย counter แยก (ไม่เขียนทับข้อมูลทุกครั้งที่มีคนเปิด), ลิงก์ raw ไม่ผ่านฐานข้อมูลหนักๆ |
| **อื่นๆ** | กัน CSRF (ตรวจ Origin), CSP + security headers, จำกัดขนาด body, กัน SSRF ตอนโหลดไฟล์เสียง, สิทธิ์แอดมินเช็คสดจาก `ADMIN_DISCORD_IDS` ทุกครั้ง |

**ข้อควรรู้:** ลิงก์ `/raw/vault/*` และ `api.โดเมน/CODE` **ไม่ผ่านด่าน captcha โดยตั้งใจ** เพราะ Roblox client ทำ captcha ไม่ได้ (loadstring จะพังทันที) จึงป้องกันด้วย rate limit ต่อ IP/ต่อโค้ดแทน ถ้าจะถล่มหนักจริง ควรเปิด Cloudflare (proxy + WAF/Bot Fight) หน้าโดเมนด้วย — เป็นชั้นที่โค้ดทำแทนไม่ได้

## แอดมิน
ใส่ Discord ID ใน `ADMIN_DISCORD_IDS` แล้ว login → จะเห็นปุ่มเพิ่มเข้าคลัง/แก้ไข/ลบบนหน้า Roblox ID และเมนู "แอดมิน" (จัดการหมวดหมู่ + ลบ vault ได้ทุกอัน)

## ที่ตั้งใจไม่ได้ใส่จากหน้า DUAROM
สคริปต์โฆษณา (Google AdSense, quge5.com) และตัวบล็อกคนใช้ ad-blocker — หน้า Vault ยืมแค่หน้าตาตัวดูโค้ด (Script / Loadstring / Raw / Copy / Views)
