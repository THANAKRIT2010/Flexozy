# แก้เว็บพัง flexozy.xyz — สรุปสาเหตุจริงจาก Console

จาก error ที่ส่งมา เจอ 2 ปัญหาแยกกัน:

## ปัญหาที่ 1 (สาเหตุหลักที่ทำให้ทั้งเว็บพัง)

```
Error: Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.
Connect Supabase in Lovable Cloud.
```

โปรเจกต์นี้ตอน dev อยู่ใน Lovable จะมี env var ของ Supabase (Lovable Cloud) ใส่ให้อัตโนมัติ
แต่พอ deploy เองผ่าน Vercel (`vercel.com/hosting7/luadersyxz`) ต้อง**ไปตั้งค่าเองทั้งหมด**
เพราะ Vercel ไม่รู้จัก Lovable Cloud

### วิธีแก้

1. เข้า Lovable editor ของโปรเจกต์นี้ → เมนู **Cloud / Supabase** (หรือ Settings → Integrations)
   หาข้อมูล Supabase project: `Project URL`, `anon/publishable key`, `service_role key`
   (หรือดูตรง ๆ ได้จาก Supabase Dashboard ของโปรเจกต์นี้ก็ได้ ถ้ามีสิทธิ์เข้า)

2. ไปที่ **Vercel → hosting7/luadersyxz → Settings → Environment Variables**
   แล้วเพิ่มตัวแปรทั้งหมดนี้ (ใส่ครบทุกตัว ไม่งั้นบางส่วนจะพังอีก):

   | ตัวแปร | ใช้ที่ไหน |
   |---|---|
   | `VITE_SUPABASE_URL` | ฝั่ง client (browser) |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | ฝั่ง client (browser) |
   | `SUPABASE_URL` | ฝั่งเซิร์ฟเวอร์ (SSR, server functions) |
   | `SUPABASE_PUBLISHABLE_KEY` | ฝั่งเซิร์ฟเวอร์ (auth middleware) |
   | `SUPABASE_SERVICE_ROLE_KEY` | ฝั่งเซิร์ฟเวอร์ (admin operations, ข้ามการ RLS) |

   `VITE_SUPABASE_URL` กับ `SUPABASE_URL` ใส่ค่าเดียวกัน, `VITE_SUPABASE_PUBLISHABLE_KEY`
   กับ `SUPABASE_PUBLISHABLE_KEY` ก็ใส่ค่าเดียวกัน — แค่ต้องมีทั้งสองชื่อเพราะโค้ดอ่านคนละจุด

3. ตั้ง Environment เป็น **Production** (และ Preview ถ้าอยากให้ preview deploy ใช้ได้ด้วย)

4. กลับไปที่ Vercel → Deployments → กด **Redeploy** ที่ deployment ล่าสุด
   (แค่ตั้งค่า env var ใหม่ deployment เก่าจะยังไม่รู้ ต้อง redeploy ถึงจะมีผล)

5. (ถ้าใช้ปุ่มอัปโหลดรูปสินค้าที่เพิ่งเพิ่มไป) ใส่ 5 ตัวแปรของ R2 เพิ่มด้วย
   ตามที่อธิบายไว้ใน `R2_UPLOAD_SETUP.md`

## ปัญหาที่ 2 (โลโก้ + พื้นหลังไม่ขึ้น, ไม่ใช่สาเหตุที่ทำเว็บพัง แต่ต้องแก้ด้วย)

```
GET https://flexozy.xyz/__l5e/assets-v1/.../flexzy-logo.png 404 (Not Found)
GET https://flexozy.xyz/__l5e/assets-v1/.../flexzy-bg-dark.png 404 (Not Found)
```

รูป 2 ไฟล์นี้ถูกอ้างอิงผ่านพาธ `/__l5e/assets-v1/...` ซึ่งเป็น CDN เฉพาะของ Lovable
เท่านั้น (proxy ให้อัตโนมัติเวลาพรีวิว/deploy ผ่าน Lovable) แต่พอ deploy เองบน Vercel
ตรง ๆ ไม่มีอะไรมาเสิร์ฟพาธนี้ให้ รูปเลยหาย

### วิธีแก้ (แก้โค้ดให้แล้ว ต้องทำต่ออีกขั้นเดียว)

โค้ดเปลี่ยนให้ไปอ้างอิงรูปจากโฟลเดอร์ `public/` แทน (`/logo.png`, `/bg-dark.png`)
ซึ่งทำงานได้บนทุกโฮสต์ คุณแค่ต้อง**ดาวน์โหลดไฟล์รูปจริง 2 ไฟล์**จาก Lovable แล้ววางไว้ที่:

```
public/logo.png       ← โลโก้ FLEXZY (จากไฟล์ flexzy-logo.png เดิม)
public/bg-dark.png    ← พื้นหลังมืด (จากไฟล์ flexzy-bg-dark.png เดิม)
```

ดาวน์โหลดได้จากหน้า Assets ในตัวแก้ไข Lovable ของโปรเจกต์นี้ (หรือคลิกขวา "Save image as"
บนรูปที่ยังโหลดได้ตอนพรีวิวใน Lovable) แล้วก็อปไฟล์ทั้งสองไปวางในโฟลเดอร์ `public/`
ของโปรเจกต์ (โฟลเดอร์เดียวกับ `favicon.png`) จากนั้น commit + push ให้ Vercel deploy ใหม่

## สรุปลำดับที่ต้องทำ

1. ตั้ง env var 5 ตัวของ Supabase บน Vercel → Redeploy (แก้เว็บพังทั้งหน้า)
2. เอาไฟล์รูป 2 ไฟล์มาวางใน `public/` → commit → push (แก้โลโก้/พื้นหลังหาย)
3. (ถ้าจะใช้ฟีเจอร์อัปโหลดรูปสินค้า) ตั้ง env var ของ R2 อีก 5 ตัวตาม `R2_UPLOAD_SETUP.md`

ทำตามนี้แล้วเว็บควรกลับมาใช้งานได้ปกติครับ ถ้า redeploy แล้วยัง error อยู่ ส่ง Console/Log
ใหม่มาดูได้เลย
