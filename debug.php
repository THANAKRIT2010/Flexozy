<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug Test v2</h2>";

require_once 'system/a_func.php';

echo "<p>Step 1: a_func.php loaded OK</p>";
echo "<p>Step 2: Config already loaded from a_func.php</p>";
echo "<pre>Config name: " . htmlspecialchars($config['name'] ?? 'N/A') . "</pre>";

echo "<h3>Testing Static Table:</h3>";
try {
    $static_data = dd_q("SELECT * FROM static LIMIT 1");
    if ($static_data) {
        $static = $static_data->fetch(PDO::FETCH_ASSOC);
        echo "<p style='color:green;'>Static table loaded</p>";
        echo "<pre>" . print_r($static, true) . "</pre>";
    } else {
        echo "<p style='color:red;'>Static query returned false</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<h3>Testing Other Tables:</h3>";

$tables = ['users', 'category', 'box_stock', 'boxlog'];
foreach ($tables as $table) {
    $result = dd_q("SELECT COUNT(*) as total FROM $table");
    if ($result) {
        $data = $result->fetch(PDO::FETCH_ASSOC);
        echo "<p style='color:green;'>$table: " . $data['total'] . " rows</p>";
    } else {
        echo "<p style='color:red;'>$table: Query failed</p>";
    }
}

echo "<hr>";
echo "<h3 style='color:green;'>✅ Debug complete!</h3>";
echo "<p><a href='?page=home'>Go to Homepage</a></p>";
