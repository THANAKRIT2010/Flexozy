# Flexozy Site Builder (Vercel Edition)

ระบบให้ผู้ใช้วางโค้ด HTML ของตัวเอง ตั้งชื่อ แล้วเผยแพร่ขึ้นเว็บได้ทันที
เข้าดูได้ที่ `flexozy.xyz/#ชื่อ` เช่น `flexozy.xyz/#mysite` — ใช้ **Upstash Redis**
(ผ่าน Vercel Marketplace) เก็บข้อมูล เพราะ Vercel ไม่มี filesystem แบบเขียนถาวร

> เวอร์ชันนี้เปลี่ยนจากรูปแบบ subdomain เดิม (`mysite.flexozy.xyz`) มาเป็น
> **hash route** (`flexozy.xyz/#mysite`) แทน — ข้อดีคือ **ไม่ต้องใช้ wildcard
> domain, ไม่ต้องย้าย nameserver ทั้งโดเมนมาที่ Vercel, ไม่ต้องมี middleware
> คอย route ตาม Host header อีกต่อไป** เพราะทุกอย่างวิ่งอยู่บนโดเมนหลักเดียว
> (`flexozy.xyz`) แล้วให้ JavaScript ฝั่งเบราว์เซอร์อ่านค่าใน `#hash` เอาเอง
> (browser ไม่ส่งส่วน `#...` ของ URL ไปที่ server อยู่แล้ว)

## โครงสร้างไฟล์

```
flexozy-vercel/
├── app/
│   ├── route.js                          ← หน้าเดียวทำทุกอย่าง: แสดง builder
│   │                                        UI ตามปกติ หรือถ้ามี #ชื่อ ต่อท้าย
│   │                                        URL จะ fetch โค้ดของเว็บนั้นมาแสดง
│   │                                        เต็มจอแทน (ฝั่ง client ล้วน ๆ)
│   └── api/
│       ├── check/[subdomain]/route.js    ← เช็คชื่อว่าง/ไม่ว่าง
│       ├── render/[subdomain]/route.js   ← คืน HTML ดิบของเว็บ (ใช้โดย view
│       │                                    mode ฝั่ง client และแท็บจัดการเว็บ)
│       └── sites/
│           ├── route.js                  ← POST สร้าง/อัปเดตเว็บ, GET รายชื่อเว็บทั้งหมด
│           └── [subdomain]/route.js      ← DELETE ลบเว็บ (ต้องใช้ edit key)
├── lib/
│   ├── redis.js                          ← Upstash Redis client
│   └── constants.js                      ← ค่าคงที่ (โดเมนหลัก, ชื่อสงวน, ขนาดจำกัด ฯลฯ)
├── package.json
└── next.config.js
```

ไม่มี `middleware.js` และไม่มี `app/render/[subdomain]/route.js` (endpoint เดิม
ที่ผูกกับ subdomain routing) อีกต่อไป เพราะไม่จำเป็นแล้ว

## เว็บที่เผยแพร่แล้วแสดงผลยังไง

1. ผู้ใช้เข้า `https://flexozy.xyz/#mysite`
2. เบราว์เซอร์โหลดหน้า `app/route.js` ตามปกติ (ส่วน `#mysite` ไม่ถูกส่งไปที่ server)
3. JavaScript ในหน้าอ่านค่า `window.location.hash` เจอ `mysite` แล้วยิง
   `fetch('/api/render/mysite')` เพื่อดึง HTML ของเว็บนั้นจาก Redis
4. ถ้าเจอ → แสดง HTML นั้นเต็มจอผ่าน `<iframe sandbox>` (แยก JS ของผู้ใช้ออก
   จากหน้า builder) พร้อมแถบเล็ก ๆ ด้านบนไว้กด "← flexozy.xyz" กลับมาหน้าแรก
5. ถ้าไม่เจอ → แสดงหน้า 404 แบบ inline พร้อมปุ่มกลับไปสร้างเว็บใหม่

การสลับไปมาระหว่างหน้า builder กับหน้าเว็บของผู้ใช้ (ผ่านการเปลี่ยน `#hash`)
ทำงานแบบ single-page app ไม่ต้องโหลดหน้าใหม่

## ขั้นตอน Deploy จริง

### 1. เตรียม Storage — Upstash Redis (ผ่าน Vercel Marketplace)

1. เข้า Vercel Dashboard ของโปรเจกต์นี้ → แท็บ **Storage**
2. เลือก **Create Database** → ค้นหา/เลือก **Upstash** (Redis) แล้วกด **Connect** หรือ **Add Integration**
3. ตั้งชื่อฐานข้อมูล เช่น `flexozy-db` แล้วเชื่อมกับโปรเจกต์นี้
4. Vercel จะเซ็ต environment variables ให้อัตโนมัติ (ชื่อประมาณ `KV_REST_API_URL` และ
   `KV_REST_API_TOKEN`, หรือ `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` แล้วแต่เวอร์ชัน
   ของ integration — โค้ดในไฟล์ `lib/redis.js` รองรับทั้งสองชื่อไว้แล้ว)
5. **สำคัญ**: หลังเชื่อม Storage แล้วต้อง **Redeploy** โปรเจกต์อีกครั้ง เพื่อให้ env vars ใหม่มีผล

### 2. ตั้งค่า Environment Variable เพิ่มเติม (ไม่บังคับ)

ใน Vercel Dashboard → Settings → Environment Variables เพิ่ม:

```
ROOT_DOMAIN = flexozy.xyz
```

(ถ้าไม่ตั้ง ระบบจะใช้ `flexozy.xyz` เป็นค่าเริ่มต้นอยู่แล้ว จากใน `lib/constants.js`)

### 3. ผูกโดเมน

ที่ Vercel Dashboard ของโปรเจกต์ → **Settings > Domains** เพิ่มโดเมนหลักตัวเดียว
พอ: พิมพ์ `flexozy.xyz` แล้วกด Add แล้วตั้งค่า DNS ตามที่ Vercel บอก (A/CNAME
record ปกติ หรือย้าย nameserver ก็ได้ แล้วแต่สะดวก)

> **ไม่ต้องเพิ่ม `*.flexozy.xyz` แบบ wildcard อีกต่อไป** เพราะไม่มี subdomain
> ให้ต้องออก wildcard SSL certificate ให้แล้ว — ใช้แค่โดเมนหลักตัวเดียว ทำให้
> ตั้งค่า DNS ง่ายและเร็วกว่าเดิมมาก

### 4. Deploy

ถ้ายังไม่เคย deploy:

```bash
npm install -g vercel
cd flexozy-vercel
vercel
```

หรือ push ขึ้น GitHub แล้วเชื่อม repo กับ Vercel ผ่านหน้าเว็บตามปกติ — Vercel จะ detect
ว่าเป็นโปรเจกต์ Next.js เองอัตโนมัติ ไม่ต้องตั้งค่า build command เพิ่ม

### 5. ทดสอบ

- เข้า `https://flexozy.xyz` → ควรเห็นหน้า builder
- สร้างเว็บทดสอบ ตั้งชื่อ เช่น `test123`
- เข้า `https://flexozy.xyz/#test123` → ควรเห็น HTML ที่วางไว้เต็มจอ

## รันทดสอบในเครื่องตัวเอง (local dev)

```bash
npm install
```

ต้องมีค่า `KV_REST_API_URL` และ `KV_REST_API_TOKEN` ก่อนถึงจะเรียก API ได้จริง — สร้างไฟล์
`.env.local`:

```
KV_REST_API_URL=https://xxxxx.upstash.io
KV_REST_API_TOKEN=xxxxxxxxxxxxxxxx
ROOT_DOMAIN=flexozy.xyz
```

(หาค่าได้จาก Upstash Console หลัง Add Integration ในขั้นตอนที่ 1 หรือสร้างฐานข้อมูลทดลองฟรีที่
upstash.com โดยตรงก็ได้)

จากนั้นรัน:

```bash
npm run dev
```

เปิด `http://localhost:3000` จะเจอหน้า builder และทดสอบดูเว็บที่สร้างได้ที่
`http://localhost:3000/#ชื่อที่สร้างไว้` ได้เลย ไม่ต้องยุ่งกับ Host header ใด ๆ

## การตั้งค่าที่ปรับได้

ในไฟล์ `lib/constants.js`:

- `ROOT_DOMAIN` — โดเมนหลัก (ตั้งผ่าน env `ROOT_DOMAIN` ได้)
- `RESERVED_SUBDOMAINS` — รายชื่อที่ห้ามผู้ใช้ตั้งเป็นชื่อเว็บ
- `MAX_HTML_SIZE_BYTES` — จำกัดขนาดโค้ดต่อเว็บ (ค่าเริ่มต้น 500KB)
- `SUBDOMAIN_REGEX` — กติกาการตั้งชื่อ (ค่าเริ่มต้น a-z, 0-9, -, ยาว 3-30 ตัวอักษร)

## ข้อควรระวัง (สำคัญ)

ระบบนี้ให้ผู้ใช้รันโค้ด HTML/JavaScript ของตัวเองตรง ๆ บนโดเมนของคุณ (ผ่าน
`<iframe sandbox>` ที่แยก origin ออกจากหน้า builder) ซึ่งหมายความว่า:

- ผู้ใช้สามารถใส่โค้ดอะไรก็ได้ รวมถึงเนื้อหาที่ไม่เหมาะสมหรือ phishing ได้ — ควรพิจารณาเพิ่มระบบ
  ตรวจสอบเนื้อหา (moderation) หรือให้แอดมินรีวิวก่อนเผยแพร่จริง ถ้าจะเปิดให้คนทั่วไปใช้งาน
- ปัจจุบัน API ไม่มีระบบยืนยันตัวตน (authentication) เต็มรูปแบบ ใช้แค่ "edit key" แบบง่าย ๆ
  เก็บเป็น plain text ใน Redis — ถ้าจะใช้งานจริงจัง ควรเพิ่มระบบสมัครสมาชิก/login และ hash
  edit key ก่อนเก็บ (เช่นด้วย bcrypt)
- ควรเพิ่ม rate limiting กับ endpoint `/api/sites` กันคนสแปมสร้างเว็บรัว ๆ — Vercel มี
  Firewall/Rate Limiting ในตัวสำหรับบาง plan หรือจะเพิ่มด้วยโค้ดเองก็ได้ (เช่นเช็คจำนวนครั้งต่อ
  IP ใน Redis)
- Upstash Redis แบบ free tier มีโควต้าจำกัด (จำนวนคำสั่งต่อวัน/เดือน) ถ้าคนใช้เยอะควรอัปเกรด plan
- เนื่องจากทุกเว็บอยู่บนโดเมนเดียวกัน (ไม่ใช่คนละ subdomain แบบเดิม) เว็บของผู้ใช้ทุกคนจะแชร์
  origin เดียวกันในสายตาเบราว์เซอร์ — โค้ดนี้ใช้ `<iframe sandbox="allow-scripts ...">` (ไม่ใส่
  `allow-same-origin` ตอนแสดงในหน้าปกติ) เพื่อกันไม่ให้ JS ของผู้ใช้เข้าถึง `localStorage`,
  cookie หรือ DOM ของหน้า builder ได้ — ถ้าจะปรับ sandbox attributes ควรระวังเรื่องนี้เป็นพิเศษ
