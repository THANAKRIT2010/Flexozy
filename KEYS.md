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
