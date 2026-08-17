<?php
header('Content-Type: application/json');
require_once '../../../system/a_func.php';

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['error' => 'ID ไม่ถูกต้อง']);
    exit;
}

$result = dd_q("SELECT * FROM popup_announcements WHERE id = ?", [$id]);
if ($result && $result->rowCount() > 0) {
    echo json_encode($result->fetch(PDO::FETCH_ASSOC));
} else {
    echo json_encode(['error' => 'ไม่พบข้อมูล']);
}
