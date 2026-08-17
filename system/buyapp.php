<?php
require_once 'a_func.php';


function dd_return($status , $message)
{
    if ($status) {

        $json = ['message' => $message];
        http_response_code(200);
        die(json_encode($json));
    } else {
        $json = ['message' => $message];
        http_response_code(400);
        die(json_encode($json));
    }
}

// //////////////////////////////////////////////////////////////////////////

function buy($id , $key , $userid) {
    // URL ของ API
    $apiUrl = "https://byshop.me/api/buy";

    // ข้อมูลที่ต้องส่ง
    $data = array(
        'id' => $id,
        'keyapi' => $key,
        'username_customer' => $userid
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

    $resultArray = json_decode($response, true);

    return $resultArray;
}

function getinfo($id) {
    $curl = curl_init();

    curl_setopt_array($curl, array(
    CURLOPT_URL => 'https://byshop.me/api/product?id='.$id, 
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    ));

    $response = curl_exec($curl);
    curl_close($curl);
    $load_packz = json_decode($response);

	foreach ($load_packz as $data) {
        return $data;
    }
}

header('Content-Type: application/json; charset=utf-8;');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_SESSION['id'])) {
        $appinfo = getinfo($_POST['id']);
        $ap =  $appinfo->price;
        $img =  $appinfo->img;
        $allprice = $ap + $byshop_cost;

        if ($user['point'] >= $allprice) {
            $api = buy($_POST['id'] , $byshop_key , $_SESSION['id']);
            $status = $api['status'];
            $mes = $api['message'];
            $name = $api['name'];

            if ($status == 'success') {
                $json_data = json_encode([
                    "username" => $config['name'],
                    "tts" => false,
                    "embeds" => [
                        [
                            "title" => "มีการสั่งซื้อแอพพรีเมี่ยมมาใหม่!",
                            "type" => "rich",
                            "timestamp" => date("c", strtotime("now")),
                            "color" => hexdec("AAFF00"),
                            "thumbnail" => [
                                "url" => "https://cdn.discordapp.com/attachments/1172513665367425214/1189855740370898965/icons8-vip-100_2.png?ex=659fae82&is=658d3982&hm=24b88c905bd8d54f78cd7aa1b73fbe9fd9b3639e8578adb2657eeed7d11deacc&",
                            ],
                            "fields" => [
                                [
                                    "name" => "ชื่อผู้ใช้",
                                    "value" => $user['username'],
                                    "inline" => false
                                ],
                                [
                                    "name" => "ชื่อสินค้า",
                                    "value" => $name,
                                    "inline" => false
                                ],
                                [
                                    "name" => "ราคา",
                                    "value" => $allprice . " บาท",
                                    "inline" => false
                                ]
                                // [
                                //     "name" => "ข้อมูลสินค้า",
                                //     "value" => $stock["username"],
                                //     "inline" => false
                                // ]
                            ]
                        ]
                    ]

                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);


                $ch = curl_init($config['webhook_dc']);
                curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/json'));
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
                curl_setopt($ch, CURLOPT_HEADER, 0);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

                $response = curl_exec($ch);
                curl_close($ch);
                ////
                $accessToken = ''; // ใส่ token linenotify

                $message = "\n";
                $message .= "มีรายการสั่งซื้อแอพ \n";
                $message .= "สินค้า: " . $name . "\n";
                $message .= "ผู้ซื้อ: " . $user['username'] . "\n";
                $message .= "รวม: " . $allprice . " บาท \n";
                date_default_timezone_set('Asia/Bangkok');
                $message .= "เวลา: " . date('Y-m-d H:i:s') . "\n";

                $apiEndpoint = 'https://notify-api.line.me/api/notify';

                $headers = array(
                    'Content-Type: application/x-www-form-urlencoded',
                    'Authorization: Bearer ' . $accessToken,
                );

                $data = array(
                    'message' => $message,
                );

                $ch = curl_init($apiEndpoint);
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                $response = curl_exec($ch);
                $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                echo '';
                //////
                $update = dd_q("UPDATE users SET point = point - ? WHERE id = ?", [$allprice , $_SESSION['id']]);
                if ($update){
                    dd_return(true , $mes);
                } else {
                    dd_return(false , 'SQL ผิดพลาด');
                }
            } else {
                if ($mes == 'ยอดเงินไม่เพียงพอ') {
                    dd_return(false , 'ยอดเงินของเจ้าของร้านไม่เพียงพอ โปรดติดต่อเจ้าของร้าน');
                } else {
                    dd_return(false , $mes);
                }
            }
        } else {
            dd_return(false , 'เงินไม่เพียงพอ');
        }
        
    } else {
        dd_return(false, "error",  "เข้าสู่ระบบก่อนทำรายการ");
    }
} else {
    dd_return(false, "error",  "Method '{$_SERVER['REQUEST_METHOD']}' not allowed!");
}
