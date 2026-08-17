<?php
// Setup script for discount_codes table
require_once 'system/a_func.php';

echo "<h2>🎫 Setup Discount Codes Table</h2>";

try {
    // Create discount_codes table
    $sql = "CREATE TABLE IF NOT EXISTS `discount_codes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `code` VARCHAR(50) NOT NULL UNIQUE,
        `discount_type` ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
        `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
        `min_purchase` DECIMAL(10,2) DEFAULT 0,
        `max_discount` DECIMAL(10,2) DEFAULT NULL,
        `usage_limit` INT DEFAULT NULL,
        `used_count` INT DEFAULT 0,
        `start_date` DATE DEFAULT NULL,
        `end_date` DATE DEFAULT NULL,
        `is_active` TINYINT(1) DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $conn->exec($sql);
    echo "<p style='color:green;'>✅ Table 'discount_codes' created successfully!</p>";

    // Create discount_usage table to track who used what code
    $sql2 = "CREATE TABLE IF NOT EXISTS `discount_usage` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `code_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        `order_id` INT DEFAULT NULL,
        `discount_amount` DECIMAL(10,2) NOT NULL,
        `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`code_id`) REFERENCES `discount_codes`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $conn->exec($sql2);
    echo "<p style='color:green;'>✅ Table 'discount_usage' created successfully!</p>";

    // Add sample discount code
    $check = dd_q("SELECT * FROM discount_codes WHERE code = 'WELCOME10'");
    if ($check->rowCount() == 0) {
        dd_q(
            "INSERT INTO discount_codes (code, discount_type, discount_value, usage_limit, is_active) VALUES (?, ?, ?, ?, ?)",
            ['WELCOME10', 'percent', 10, 100, 1]
        );
        echo "<p style='color:blue;'>📌 Sample code 'WELCOME10' (10% off) added!</p>";
    }

    echo "<hr>";
    echo "<h3 style='color:green;'>🎉 Setup Complete!</h3>";
    echo "<p>You can now manage discount codes from admin panel.</p>";
    echo "<p><a href='?page=backend'>Go to Admin Panel</a></p>";

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>