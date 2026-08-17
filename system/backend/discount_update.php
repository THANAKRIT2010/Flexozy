<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

if (!isset($_SESSION['id']) || $user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์เข้าถึง']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$code = trim($_POST['code'] ?? '');
$type = $_POST['type'] ?? 'percent';
$value = floatval($_POST['value'] ?? 0);
$min = floatval($_POST['min'] ?? 0);
$limit = intval($_POST['limit'] ?? 0);
$active = intval($_POST['active'] ?? 1);

if ($id <= 0 || empty($code) || $value <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'ข้อมูลไม่ถูกต้อง']);
    exit;
}

// Check if code exists for other records
$check = dd_q("SELECT id FROM discount_codes WHERE code = ? AND id != ?", [$code, $id]);
if ($check && $check->rowCount() > 0) {
    echo json_encode(['status' => 'error', 'message' => 'โค้ดนี้มีอยู่แล้ว']);
    exit;
}

$result = dd_q(
    "UPDATE discount_codes SET code = ?, discount_type = ?, discount_value = ?, min_purchase = ?, usage_limit = ?, is_active = ? WHERE id = ?",
    [$code, $type, $value, $min, $limit > 0 ? $limit : null, $active, $id]
);

if ($result) {
    echo json_encode(['status' => 'success', 'message' => 'อัพเดทโค้ดส่วนลดสำเร็จ!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด']);
}
