<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

if (!isset($_SESSION['id']) || $user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์เข้าถึง']);
    exit;
}

$code = trim($_POST['code'] ?? '');
$type = $_POST['type'] ?? 'percent';
$value = floatval($_POST['value'] ?? 0);
$min = floatval($_POST['min'] ?? 0);
$limit = intval($_POST['limit'] ?? 0);
$active = intval($_POST['active'] ?? 1);

if (empty($code)) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกรหัสโค้ด']);
    exit;
}

if ($value <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'มูลค่าส่วนลดต้องมากกว่า 0']);
    exit;
}

// Check if code already exists
$check = dd_q("SELECT id FROM discount_codes WHERE code = ?", [$code]);
if ($check && $check->rowCount() > 0) {
    echo json_encode(['status' => 'error', 'message' => 'โค้ดนี้มีอยู่แล้ว']);
    exit;
}

// Insert new discount code
$result = dd_q(
    "INSERT INTO discount_codes (code, discount_type, discount_value, min_purchase, usage_limit, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    [$code, $type, $value, $min, $limit > 0 ? $limit : null, $active]
);

if ($result) {
    echo json_encode(['status' => 'success', 'message' => 'สร้างโค้ดส่วนลดสำเร็จ!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด กรุณาลองใหม่']);
}
