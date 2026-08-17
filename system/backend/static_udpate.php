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

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_SESSION['id'])) {
        $q_1 = dd_q('SELECT * FROM users WHERE id = ? AND rank = 1 ', [$_SESSION['id']]);
        if ($q_1->rowCount() >= 1) {
            $m_count = intval($_POST['m_count'] ?? 0);
            $c_count = intval($_POST['c_count'] ?? 0);
            $s_count = intval($_POST['s_count'] ?? 0);
            $sold_count = intval($_POST['sold_count'] ?? 0);

            $insert = dd_q("UPDATE static SET m_count = ?, c_count = ?, s_count = ?, sold_count = ?, last_change = NOW()", [
                $m_count,
                $c_count,
                $s_count,
                $sold_count
            ]);

            if ($insert) {
                dd_return(true, "บันทึกสถิติสำเร็จ");
            } else {
                dd_return(false, "SQL ผิดพลาด");
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
