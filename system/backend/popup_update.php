<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

if (!isset($_SESSION['id']) || $user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์เข้าถึง']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$content = trim($_POST['content'] ?? '');
$image = trim($_POST['image'] ?? '');
$button_text = trim($_POST['button_text'] ?? 'ถัดไป');
$button_link = trim($_POST['button_link'] ?? '');
$active = intval($_POST['active'] ?? 1);

if ($id <= 0 || empty($title)) {
    echo json_encode(['status' => 'error', 'message' => 'ข้อมูลไม่ถูกต้อง']);
    exit;
}

$result = dd_q(
    "UPDATE popup_announcements SET title = ?, content = ?, image_url = ?, button_text = ?, button_link = ?, is_active = ? WHERE id = ?",
    [$title, $content, $image ?: null, $button_text, $button_link ?: null, $active, $id]
);

if ($result) {
    echo json_encode(['status' => 'success', 'message' => 'อัพเดทประกาศสำเร็จ!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด']);
}
