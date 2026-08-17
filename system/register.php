<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'a_func.php';

function dd_return($status, $message)
{
    if ($status) {
        $json = ['status' => 'success', 'message' => $message];
        http_response_code(200);
        die(json_encode($json));
    } else {
        $json = ['status' => 'fail', 'message' => $message];
        http_response_code(200);
        die(json_encode($json));
    }
}

//////////////////////////////////////////////////////////////////////////

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_SESSION['id'])) {
        $user_login = $_POST['user'];
        $pwd_login = $_POST['pass'];
        $pwd2_login = $_POST['pass2'];
        $secret = $conf['secretkey'];
        $response = $_POST["captcha"];
        $verify = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secret}&response={$response}");
        $captcha_success = json_decode($verify);
        if ($captcha_success->success == false) {
            dd_return(false, "กรุณายืนยันตัวตน");
        } else if ($captcha_success->success == true) {
            //================================================================
            if ($user_login != "" && $pwd_login != "" && $pwd2_login != "") {
                if ($pwd_login == $pwd2_login) {
                    $q = dd_q("SELECT * FROM users WHERE username = ? ", [$_POST['user']]);
                    if ($q->rowCount() == 1) {
                        dd_return(false, "ชื่อนี้ผู้ใช้แล้ว");
                    } else {
                        $in = dd_q("INSERT INTO users (username,password,date,point,total) VALUES ( ? , ? , NOW() , 0 , 0 )", [
                            $user_login,
                            md5($pwd_login)
                        ]);
                        if ($in == true) {
                            $q = dd_q("SELECT * FROM users WHERE username = ? AND password = ? ", [
                                $user_login,
                                md5($pwd_login)
                            ]);
                            $dt = $q->fetch(PDO::FETCH_ASSOC);
                            $_SESSION['id'] = $dt['id'];
                            dd_return(true, "สมัครสมาชิกสำเร็จ");
                        } else {
                            dd_return(false, "ผิดพลาด");
                        }
                    }
                } else {
                    dd_return(false, "โปรดป้อนรหัสผ่านทั้งสองให้ตรงกัน");
                }
            } else {
                dd_return(false, "กรุณากรอกข้อมูลให้ครบ");
            }
            //================================================================
        } else {
            dd_return(false, "ไม่สามารถใช้งานได้");
        }
    } else {
        dd_return(false, "ออกจากระบบก่อน");
    }
}
dd_return(false, "Method '{$_SERVER['REQUEST_METHOD']}' not allowed!");
