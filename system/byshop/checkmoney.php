<?php
require_once("../a_func.php");

// URL ของ API
$apiUrl = "https://byshop.me/api/money";

// ข้อมูลที่ต้องส่ง
$data = array(
    'keyapi' => $byshop_key,
);

// กำหนดตัวเลือกของ cURL
$options = array(
    CURLOPT_URL => $apiUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_RETURNTRANSFER => true,
);

// สร้าง cURL handle
$ch = curl_init();
curl_setopt_array($ch, $options);

// ทำ HTTP POST request
$response = curl_exec($ch);



function dd_return($status, $message) {
    if ($status) {
        $json = ['status'=> 'success','message' => $message];
        http_response_code(200);
        die(json_encode($json));
    }else{
        $json = ['status'=> 'fail','message' => $message];
        http_response_code(400);
        die(json_encode($json));
    }
}


//////////////////////////////////////////////////////////////////////////

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_SESSION['id'])) {
        if (
            $_POST['st'] != ""
        ) {
            $q_1 = dd_q('SELECT * FROM users WHERE id = ? AND rank = 1 ', [$_SESSION['id']]);
            if ($q_1->rowCount() >= 1) {
                $resultArray = json_decode($response, true);
                $money = $resultArray['money'];
                if ($money != "") {
                    dd_return(true , "เงินคงเหลือ ".$money." บาท");
                } else {
                    dd_return(false , "ไม่สามารถตรวจสอบได้ Api Key อาจไม่ถูกต้อง");
                }
                
            }else{
                dd_return(false, "เซสชั่นผิดพลาด โปรดล็อกอินใหม่");
                session_destroy();
            }
        }else{
            dd_return(false, "กรุณากรอกข้อมูลให้ครบ");
        }
    }else{
        dd_return(false, "เข้าสู่ระบบก่อน");
    }
}else{
    dd_return(false, "Method '{$_SERVER['REQUEST_METHOD']}' not allowed!");
}

// ปิด cURL handle
curl_close($ch);
?>
