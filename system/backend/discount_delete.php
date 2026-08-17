<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

if (!isset($_SESSION['id']) || $user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์เข้าถึง']);
    exit;
}

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'ID ไม่ถูกต้อง']);
    exit;
}

$result = dd_q("DELETE FROM discount_codes WHERE id = ?", [$id]);

if ($result) {
    echo json_encode(['status' => 'success', 'message' => 'ลบโค้ดส่วนลดสำเร็จ!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด']);
}
