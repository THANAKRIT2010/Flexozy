<?php
header('Content-Type: application/json');
require_once '../../system/a_func.php';

$code = trim($_POST['code'] ?? '');
$total = floatval($_POST['total'] ?? 0);

if (empty($code)) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกโค้ดส่วนลด']);
    exit;
}

// Find discount code
$result = dd_q("SELECT * FROM discount_codes WHERE code = ? AND is_active = 1", [$code]);

if (!$result || $result->rowCount() == 0) {
    echo json_encode(['status' => 'error', 'message' => 'ไม่พบโค้ดส่วนลดนี้ หรือโค้ดหมดอายุ']);
    exit;
}

$discount = $result->fetch(PDO::FETCH_ASSOC);

// Check usage limit
if ($discount['usage_limit'] !== null && $discount['used_count'] >= $discount['usage_limit']) {
    echo json_encode(['status' => 'error', 'message' => 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว']);
    exit;
}

// Check min purchase
if ($total < $discount['min_purchase']) {
    echo json_encode(['status' => 'error', 'message' => 'ยอดซื้อขั้นต่ำ ' . number_format($discount['min_purchase']) . ' บาท']);
    exit;
}

// Check date range
if ($discount['start_date'] && date('Y-m-d') < $discount['start_date']) {
    echo json_encode(['status' => 'error', 'message' => 'โค้ดยังไม่เริ่มใช้งาน']);
    exit;
}

if ($discount['end_date'] && date('Y-m-d') > $discount['end_date']) {
    echo json_encode(['status' => 'error', 'message' => 'โค้ดหมดอายุแล้ว']);
    exit;
}

// Check if user already used this code (if logged in)
if (isset($_SESSION['id'])) {
    $used = dd_q("SELECT id FROM discount_usage WHERE code_id = ? AND user_id = ?", [$discount['id'], $_SESSION['id']]);
    if ($used && $used->rowCount() > 0) {
        echo json_encode(['status' => 'error', 'message' => 'คุณเคยใช้โค้ดนี้แล้ว']);
        exit;
    }
}

// Calculate discount amount
$discount_amount = 0;
if ($discount['discount_type'] == 'percent') {
    $discount_amount = ($total * $discount['discount_value']) / 100;
    if ($discount['max_discount'] !== null && $discount_amount > $discount['max_discount']) {
        $discount_amount = $discount['max_discount'];
    }
    $discount_text = $discount['discount_value'] . '%';
} else {
    $discount_amount = $discount['discount_value'];
    $discount_text = '฿' . number_format($discount['discount_value']);
}

$final_total = max(0, $total - $discount_amount);

echo json_encode([
    'status' => 'success',
    'message' => 'ใช้โค้ดสำเร็จ!',
    'discount_id' => $discount['id'],
    'discount_text' => $discount_text,
    'discount_amount' => $discount_amount,
    'final_total' => $final_total
]);
