<?php
/**
 * Database Migration: Add Stats Boost Columns
 * 
 * เปิดไฟล์นี้ในเบราว์เซอร์ 1 ครั้งเพื่อเพิ่ม column ใหม่ในตาราง static
 * URL: http://localhost/setup_stats.php
 */

require_once 'system/a_func.php';

echo "<h2>🔧 Adding Stats Boost Columns...</h2>";

$queries = [
    // เพิ่ม c_count สำหรับ boost จำนวนหมวดหมู่
    "ALTER TABLE `static` ADD COLUMN IF NOT EXISTS `c_count` INT DEFAULT 0",

    // เพิ่ม sold_count สำหรับ boost จำนวนขายแล้ว  
    "ALTER TABLE `static` ADD COLUMN IF NOT EXISTS `sold_count` INT DEFAULT 0"
];

$success = 0;
$failed = 0;

foreach ($queries as $sql) {
    try {
        dd_q($sql);
        echo "<p style='color: green;'>✅ Success: " . htmlspecialchars(substr($sql, 0, 60)) . "...</p>";
        $success++;
    } catch (Exception $e) {
        // Column อาจมีอยู่แล้ว ลอง query แบบอื่น
        try {
            // ลองแบบไม่มี IF NOT EXISTS (สำหรับ MySQL เวอร์ชั่นเก่า)
            $simple_sql = str_replace(" IF NOT EXISTS", "", $sql);
            dd_q($simple_sql);
            echo "<p style='color: green;'>✅ Success: " . htmlspecialchars(substr($sql, 0, 60)) . "...</p>";
            $success++;
        } catch (Exception $e2) {
            // ถ้า error เพราะ column มีอยู่แล้ว ก็ถือว่าโอเค
            if (strpos($e2->getMessage(), 'Duplicate column') !== false) {
                echo "<p style='color: blue;'>ℹ️ Column already exists, skipping...</p>";
                $success++;
            } else {
                echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e2->getMessage()) . "</p>";
                $failed++;
            }
        }
    }
}

echo "<hr>";
echo "<h3>📊 Result: $success success, $failed failed</h3>";

if ($failed == 0) {
    echo "<p style='color: green; font-size: 18px;'><strong>🎉 สำเร็จ! ระบบ Boost สถิติพร้อมใช้งานแล้ว</strong></p>";
    echo "<p>คุณสามารถลบไฟล์นี้ได้แล้ว แล้วไปที่:</p>";
    echo "<ul>";
    echo "<li><a href='?page=website'>ตั้งค่าเว็บไซต์</a> > คลิกปุ่ม <strong>สถิติโชว์</strong></li>";
    echo "<li><a href='?page=home'>หน้าหลัก</a> เพื่อดูผลลัพธ์</li>";
    echo "</ul>";
} else {
    echo "<p style='color: orange;'>⚠️ มีบาง query ไม่สำเร็จ แต่ระบบน่าจะยังใช้งานได้</p>";
}
?>

<style>
    body {
        font-family: 'Kanit', sans-serif;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
        background: #f5f5f5;
    }

    h2 {
        color: #333;
    }

    p {
        margin: 10px 0;
        padding: 10px;
        background: #fff;
        border-radius: 8px;
    }
</style>