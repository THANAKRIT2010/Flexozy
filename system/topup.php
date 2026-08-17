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
        http_response_code(400);
        die(json_encode($json));
    }
}


function wallet($link , $phone)
{
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://api.xdnvc.store/api/wallet',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => http_build_query(['lnk' => $link, 'phone' => $phone]),
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ),
    ));
    
    $res = curl_exec($curl);
    
    curl_close($curl);
    
    if ($res === false) {
        return 'ไม่สามารถเชื่อมต่อ api ได้';
    }

    return json_decode($res);
}


//////////////////////////////////////////////////////////////////////////

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_SESSION['id'])) {
        $link = $_POST['link'];
        if ($link != "") {

            $res = wallet($link , $config["wallet"]);
            if (isset($res)) {
                if ($res->status ==  400) {
                    dd_return(false, $res->message);
                } elseif ($res->status ==  200) {
                    $amount = $res->amount;
                    $plr = dd_q("SELECT * FROM users WHERE id = ?", [$_SESSION["id"]])->fetch(PDO::FETCH_ASSOC);
                    $update = dd_q("UPDATE users SET point = ?, total = ? WHERE id = ?", [$plr["point"] + $amount,$plr["total"] + $amount, $_SESSION["id"]]);
                    $insert = dd_q("INSERT INTO topup_his (link, amount, date, uid, uname) VALUES (?, ?, NOW(), ?, ?)", [$link, $amount, $plr["id"], $plr["username"]]);

                    if ($update && $insert) {
                        dd_return(true, 'คุณได้รับเงินจำนวน '. $amount . ' บาท');
                    } else {
                        dd_return(false, "SQL ERR");
                    }
                }
            } else {
                dd_return(false, "API ERR");
            }
        } else {
            dd_return(false, "กรุณาใส่ลิ้ง");
        }
    } else {
        dd_return(false, "เข้าสู่ระบบก่อนดำเนินการครับ ");
    }
} else {
    dd_return(false, "Method '{$_SERVER['REQUEST_METHOD']}' not allowed!");
}