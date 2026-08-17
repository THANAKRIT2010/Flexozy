<?php
// Add discord_server column to setting table
require_once 'system/a_func.php';

echo "<h2>📱 Setup Discord Server Field</h2>";

try {
    // Check if column exists
    $check = $conn->query("SHOW COLUMNS FROM setting LIKE 'discord_server'");

    if ($check->rowCount() == 0) {
        $conn->exec("ALTER TABLE setting ADD COLUMN discord_server VARCHAR(100) DEFAULT '' AFTER webhook_dc");
        echo "<p style='color:green;'>✅ Column 'discord_server' added successfully!</p>";
    } else {
        echo "<p style='color:blue;'>ℹ️ Column 'discord_server' already exists!</p>";
    }

    echo "<hr>";
    echo "<h3 style='color:green;'>🎉 Setup Complete!</h3>";
    echo "<p>You can now set Discord Server ID in admin settings.</p>";
    echo "<p><a href='?page=website'>Go to Website Settings</a></p>";

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>