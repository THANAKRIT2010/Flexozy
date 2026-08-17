<?php
session_start();
header('Content-Type: application/json');
require_once("../a_func.php");

if (!isset($_SESSION['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณาเข้าสู่ระบบ']);
    exit;
}

// Check if user is admin
$check_admin = dd_q("SELECT rank FROM users WHERE id = ?", [$_SESSION['id']]);
$user = $check_admin->fetch(PDO::FETCH_ASSOC);

if ($user['rank'] != '1') {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
    exit;
}

if (!isset($_POST['p_id']) || empty($_POST['p_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'ไม่พบรหัสสินค้า']);
    exit;
}

$p_id = $_POST['p_id'];

// Count existing stock before deletion
$count_q = dd_q("SELECT COUNT(*) as total FROM box_stock WHERE p_id = ?", [$p_id]);
$count_result = $count_q->fetch(PDO::FETCH_ASSOC);
$total_deleted = $count_result['total'];

if ($total_deleted == 0) {
    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสต็อกให้ลบ']);
    exit;
}

// Delete all stock for this product
$delete = dd_q("DELETE FROM box_stock WHERE p_id = ?", [$p_id]);

echo json_encode([
    'status' => 'success',
    'message' => "ล้างสต็อกสำเร็จ ลบไป $total_deleted รายการ"
]);
