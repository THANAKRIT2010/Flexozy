<?php
/**
 * 🏦 Secure SlipOK Verification System
 * Integrated with SlipOK API for Server-Side Slip Checking
 */

error_reporting(0);
header('Content-Type: application/json; charset=utf-8');
require_once './a_func.php';

// Response Helper
function respond($success, $msg, $data = [])
{
    http_response_code($success ? 200 : 400);
    die(json_encode([
        'status' => $success ? 'success' : 'error',
        'message' => $msg,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed');
}
if (!isset($_SESSION['id'])) {
    respond(false, 'กรุณาเข้าสู่ระบบก่อน');
}

// 1. Fetch Config & User
$setting = dd_q("SELECT * FROM setting LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$bank = dd_q("SELECT * FROM bank LIMIT 1")->fetch(PDO::FETCH_ASSOC);

$user = dd_q("SELECT username, point FROM users WHERE id = ?", [$_SESSION['id']])->fetch(PDO::FETCH_ASSOC);
if (!$user) {
    respond(false, 'ไม่พบข้อมูลผู้ใช้');
}

function logTransaction($ref, $amount, $uid, $uname, $status, $note)
{
    dd_q(
        "INSERT INTO topup_his (link, amount, date, uid, uname) VALUES (?, ?, NOW(), ?, ?)",
        ["สลิป (Ref: $ref)", $amount, $uid, $uname]
    );
}

// 2. Check File Upload
if (!isset($_FILES['slip_image']) || $_FILES['slip_image']['error'] !== UPLOAD_ERR_OK) {
    respond(false, 'กรุณาแนบไฟล์สลิปการโอนเงิน');
}

$file = $_FILES['slip_image'];
$imageHash = md5_file($file['tmp_name']);

// Prevent duplicate file re-upload locally
$checkLocal = dd_q("SELECT id FROM kbank_trans WHERE qr = ?", [$imageHash]);
if ($checkLocal && $checkLocal->rowCount() > 0) {
    respond(false, 'สลิปใบนี้เคยถูกใช้งานในระบบไปแล้ว');
}

// 3. SlipOK API Integration
$apiKey = $setting['slip_api_key'] ?? 'SLIPOKX0VSODQ';
$branchId = $setting['slip_api_branch'] ?? '71124';

$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => "https://api.slipok.com/api/line/apikey/" . rawurlencode($branchId),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => array(
        'files' => new CURLFile($file['tmp_name'], $file['type'], $file['name']),
        'log' => 'true'
    ),
    CURLOPT_HTTPHEADER => array(
        "x-authorization: " . $apiKey
    ),
));

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    respond(false, 'ไม่สามารถเชื่อมต่อระบบตรวจสอบสลิป SlipOK ได้ (cURL Error: ' . $err . ')');
}

$resData = json_decode($response, true);

if (!$resData['success']) {
    $errorMsg = $resData['message'] ?? 'สลิปไม่ถูกต้อง หรือไม่พบข้อมูลสลิปในระบบ';
    respond(false, $errorMsg);
}

// SlipOK Returned Success
$slipData = $resData['data'];
$amount = floatval($slipData['amount'] ?? 0);
$ref = $slipData['transRef'] ?? ($slipData['transId'] ?? 'SLIPOK_' . time());

if ($amount <= 0) {
    respond(false, 'จำนวนเงินในสลิปไม่ถูกต้อง');
}

// Check Duplicate Ref ID in DB
$checkRef = dd_q("SELECT id FROM kbank_trans WHERE ref = ?", [$ref]);
if ($checkRef && $checkRef->rowCount() > 0) {
    respond(false, 'สลิปรายการนี้ถูกใช้งานไปแล้ว! (Ref: ' . $ref . ')');
}

// 4. Update Database (Atomic Operation)
try {
    $conn->beginTransaction();

    // Save Transaction Log
    dd_q(
        "INSERT INTO kbank_trans (ref, sender, amount, qr, slip_image, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [$ref, $user['username'], $amount, $imageHash, 'slipok_verified']
    );

    // Update User Points
    dd_q("UPDATE users SET point = point + ?, total = total + ? WHERE id = ?", [$amount, $amount, $_SESSION['id']]);

    // Topup History
    logTransaction($ref, $amount, $_SESSION['id'], $user['username'], 'success', 'SlipOK Auto Verified');

    $conn->commit();

    respond(true, 'เติมเงินสำเร็จจำนวน ' . number_format($amount, 2) . ' บาท', [
        'amount' => $amount,
        'ref' => $ref
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    respond(false, 'เกิดข้อผิดพลาดในการเติมเงิน: ' . $e->getMessage());
}
