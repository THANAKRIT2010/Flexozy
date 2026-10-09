# ระบบ Key + HWID (เพิ่มใหม่)

## เปิดใช้งาน
- ลิงก์เดี่ยว (เช่น /raw/FlexozyScript): หลังบ้านแอดมิน → ปุ่ม "บังคับ key" ที่ลิงก์นั้น (หรือติ๊กตอนสร้างลิงก์) / ENV `KEY_ALL_LINKS=1` = บังคับทุกลิงก์
- Hub (/loader → เกมทั้งหมด): ENV `REQUIRE_KEY_HUB=1` → URL สคริปต์เกมถูกซ่อน ดึงผ่านเซิร์ฟเวอร์ด้วย key เท่านั้น
- ต้องตั้ง `SESSION_SECRET` (สตริงสุ่มยาว ๆ) บน production และใช้ Vercel KV

## ผู้ใช้
    getgenv().Key = "FX-XXXX-XXXX-XXXX-XXXX"
    loadstring(game:HttpGet("https://api.flexozy.xyz/raw/FlexozyScript"))()

## ขั้นตอนทำงาน
POST /auth {key,hwid,scope} -> token 60 วิ ใช้ครั้งเดียว ผูก key+scope -> /stage/CODE หรือ /game-script/ID ตอบซอสแบบ XOR
key ผูก HWID เครื่องแรก (เก็บเป็น hash) / เพิกถอน รีเซ็ต HWID ดูประวัติได้ที่หลังบ้าน / /auth จำกัด 30 ครั้งต่อนาทีต่อ IP และล็อกถ้าผิดเกิน 8 ครั้งใน 10 นาที

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
