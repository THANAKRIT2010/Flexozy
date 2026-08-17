<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../a_func.php';

function dd_return($status, $message)
{
    $json = ['message' => $message];
    if ($status) {
        http_response_code(200);
        die(json_encode($json));
    } else {
        http_response_code(400);
        die(json_encode($json));
    }
}

//////////////////////////////////////////////////////////////////////////

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_SESSION['id'])) {
        $q_1 = dd_q('SELECT * FROM users WHERE id = ? AND rank = 1 ', [$_SESSION['id']]);
        if ($q_1->rowCount() >= 1) {
            
            // 1. Update Bank Table
            $updateBank = dd_q(
                "UPDATE bank SET fname = ?, lname = ?, bnum = ?, tname = ?, promptpay_id = ?",
                [
                    $_POST['fname'] ?? '',
                    $_POST['lname'] ?? '',
                    $_POST['bnum'] ?? '',
                    $_POST['tname'] ?? '',
                    $_POST['promptpay_id'] ?? ''
                ]
            );

            // 2. Update Setting Table (SlipOK API Credentials)
            $updateSetting = dd_q(
                "UPDATE setting SET slip_api_type = 'slipok', slip_api_key = ?, slip_api_branch = ?",
                [
                    $_POST['slip_api_key'] ?? '',
                    $_POST['slip_api_branch'] ?? ''
                ]
            );

            if ($updateBank && $updateSetting) {
                dd_return(true, "บันทึกการตั้งค่า SlipOK และข้อมูลธนาคารเรียบร้อยแล้ว");
            } else {
                dd_return(false, "เกิดข้อผิดพลาดในการบันทึกข้อมูล SQL");
            }

        } else {
            dd_return(false, "เซสชั่นผิดพลาด โปรดล็อกอินใหม่");
            session_destroy();
        }
    } else {
        dd_return(false, "เข้าสู่ระบบก่อน");
    }
} else {
    dd_return(false, "Method '{$_SERVER['REQUEST_METHOD']}' not allowed!");
}
