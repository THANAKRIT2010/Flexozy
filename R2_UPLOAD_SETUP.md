# ตั้งค่าอัปโหลดรูปสินค้าไป Cloudflare R2

หน้าแอดมิน (`/admin` → แท็บ "สินค้า") ตอนนี้มีปุ่ม **"อัปโหลดรูปจากเครื่อง"**
ที่อัปโหลดไฟล์ตรงไปยัง Cloudflare R2 แล้ววางลิงก์ให้อัตโนมัติ
แทนที่การอัปโหลดผ่านหน้า Vercel Blob Storage ด้วยมือแล้วก็อปลิงก์มาวาง
(ซึ่งเป็นสาเหตุที่ Blob store เต็มโควต้าตามภาพที่ส่งมา)

แอปนี้ deploy บน Cloudflare อยู่แล้ว การใช้ R2 จึงอยู่ในเครือเดียวกัน
และ **R2 ไม่คิดค่า egress** (ต่างจาก Vercel Blob ที่คิดตาม Data Transfer)

## 1. สร้าง R2 bucket

1. ไปที่ Cloudflare Dashboard → R2 → Create bucket
2. ตั้งชื่อ bucket เช่น `flexzy-uploads`
3. เปิด **Public Access** ให้กับ bucket (Settings → Public Access → Allow Access)
   จะได้ URL สาธารณะแบบ `https://pub-xxxxxxxx.r2.dev` (หรือผูกโดเมนของตัวเองก็ได้)

## 2. สร้าง API Token สำหรับ R2

1. Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token
2. สิทธิ์: Object Read & Write, จำกัดเฉพาะ bucket ที่สร้างไว้ก็ได้เพื่อความปลอดภัย
3. คัดลอก **Access Key ID** และ **Secret Access Key** เก็บไว้ (โชว์ครั้งเดียว)
4. หา **Account ID** ได้จากหน้า Cloudflare Dashboard (มุมขวาของหน้า R2 overview)

## 3. ตั้งค่า Environment Variables

เพิ่มตัวแปรเหล่านี้ในที่ตั้งค่า Environment ของโปรเจกต์ (Lovable Cloud / Cloudflare Pages settings):

| ตัวแปร | ค่า |
|---|---|
| `R2_ACCOUNT_ID` | Account ID จาก Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID จาก API Token |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key จาก API Token |
| `R2_BUCKET_NAME` | ชื่อ bucket เช่น `flexzy-uploads` |
| `R2_PUBLIC_URL` | URL สาธารณะของ bucket เช่น `https://pub-xxxxxxxx.r2.dev` (ไม่ต้องมี `/` ท้าย) |

## 4. ติดตั้ง dependency ใหม่

โค้ดใช้ไลบรารี `aws4fetch` (เพิ่มใน `package.json` แล้ว) สำหรับเซ็น request แบบ S3
รันคำสั่งติดตั้งอีกครั้งก่อน build/deploy:

```sh
npm i
# หรือ
bun install
```

## หลังจากตั้งค่าเสร็จ

- ปุ่ม "อัปโหลดรูปจากเครื่อง" ในหน้าแอดมินจะใช้งานได้ทันที (จำกัดไฟล์ ≤ 5MB, รองรับ PNG/JPEG/WEBP/GIF)
- ยังวางลิงก์รูปภาพจากที่อื่นในช่องข้อความได้ตามเดิมถ้าต้องการ
- ระบบเช็คสิทธิ์แอดมินฝั่งเซิร์ฟเวอร์ก่อนอัปโหลดทุกครั้ง (ผ่าน `has_role` ที่มีอยู่แล้วในฐานข้อมูล)
- คุณสามารถเลิกใช้ Vercel Blob store (`luadersyxz-blob`) ได้เลยหลังจากย้ายมาใช้ทางนี้แล้ว
  (รูปเก่าที่ยังอ้างอิง URL จาก Vercel Blob จะยังใช้งานได้จนกว่า store นั้นจะถูกลบ)
