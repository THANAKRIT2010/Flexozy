<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

if (!isset($_SESSION['id']) || $user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์เข้าถึง']);
    exit;
}

$title = trim($_POST['title'] ?? '');
$content = trim($_POST['content'] ?? '');
$image = trim($_POST['image'] ?? '');
$button_text = trim($_POST['button_text'] ?? 'ถัดไป');
$button_link = trim($_POST['button_link'] ?? '');
$active = intval($_POST['active'] ?? 1);

if (empty($title)) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกหัวข้อประกาศ']);
    exit;
}

$result = dd_q(
    "INSERT INTO popup_announcements (title, content, image_url, button_text, button_link, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    [$title, $content, $image ?: null, $button_text, $button_link ?: null, $active]
);

if ($result) {
    echo json_encode(['status' => 'success', 'message' => 'เพิ่มประกาศสำเร็จ!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด']);
}
