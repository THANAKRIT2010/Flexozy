<?php
// Setup script for popup announcements table
require_once 'system/a_func.php';

echo "<h2>📢 Setup Popup Announcements Table</h2>";

try {
    // Create popup_announcements table
    $sql = "CREATE TABLE IF NOT EXISTS `popup_announcements` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `content` TEXT,
        `image_url` VARCHAR(500) DEFAULT NULL,
        `button_text` VARCHAR(100) DEFAULT 'ถัดไป',
        `button_link` VARCHAR(500) DEFAULT NULL,
        `is_active` TINYINT(1) DEFAULT 1,
        `show_order` INT DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $conn->exec($sql);
    echo "<p style='color:green;'>✅ Table 'popup_announcements' created successfully!</p>";

    // Add sample announcement
    $check = dd_q("SELECT * FROM popup_announcements WHERE title = 'ยินดีต้อนรับ'");
    if ($check->rowCount() == 0) {
        dd_q(
            "INSERT INTO popup_announcements (title, content, button_text, is_active) VALUES (?, ?, ?, ?)",
            ['ยินดีต้อนรับ', 'ยินดีต้อนรับสู่ร้านค้าของเรา!', 'เข้าสู่ร้านค้า', 1]
        );
        echo "<p style='color:blue;'>📌 Sample announcement added!</p>";
    }

    echo "<hr>";
    echo "<h3 style='color:green;'>🎉 Setup Complete!</h3>";
    echo "<p>You can now manage popup announcements from admin panel.</p>";
    echo "<p><a href='?page=backend'>Go to Admin Panel</a></p>";

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>