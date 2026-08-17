<?php
/**
 * 🔗 Discord Link API
 * API สำหรับเชื่อม Discord ID กับบัญชีเว็บไซต์
 * 
 * วิธีใช้:
 * - User พิมพ์ /link ในบอท Discord
 * - บอทจะสร้างลิ้งค์: yoursite.com/api/discord_link.php?code=XXXXX
 * - User คลิกลิ้งค์ขณะ Login อยู่ในเว็บ
 * - ระบบจะเชื่อม Discord ID กับบัญชี
 */

session_start();
require_once(__DIR__ . '/../system/a_func.php');

header('Content-Type: application/json; charset=utf-8');

// CORS (ถ้าต้องการ)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

/**
 * ฟังก์ชั่นสร้าง Link Code
 */
function generate_link_code($discord_id)
{
    global $conn;

    $code = bin2hex(random_bytes(16));
    $expires = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // ลบ code เก่า
    $stmt = $conn->prepare("DELETE FROM discord_link_codes WHERE discord_id = ? OR expires_at < NOW()");
    $stmt->execute([$discord_id]);

    // สร้าง code ใหม่
    $stmt = $conn->prepare("INSERT INTO discord_link_codes (code, discord_id, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$code, $discord_id, $expires]);

    return $code;
}

/**
 * ฟังก์ชั่น Link บัญชี
 */
function link_account($code, $user_id)
{
    global $conn;

    // หา code
    $stmt = $conn->prepare("SELECT * FROM discord_link_codes WHERE code = ? AND expires_at > NOW() LIMIT 1");
    $stmt->execute([$code]);
    $link_data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$link_data) {
        return ['success' => false, 'message' => 'รหัสหมดอายุหรือไม่ถูกต้อง'];
    }

    $discord_id = $link_data['discord_id'];

    // ตรวจสอบว่า Discord ID นี้เชื่อมกับบัญชีอื่นแล้วหรือไม่
    $stmt = $conn->prepare("SELECT id, username FROM users WHERE discord_id = ? AND id != ? LIMIT 1");
    $stmt->execute([$discord_id, $user_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        return ['success' => false, 'message' => 'Discord นี้เชื่อมกับบัญชี ' . $existing['username'] . ' อยู่แล้ว'];
    }

    // เชื่อมบัญชี
    $stmt = $conn->prepare("UPDATE users SET discord_id = ? WHERE id = ?");
    $result = $stmt->execute([$discord_id, $user_id]);

    if ($result) {
        // ลบ code
        $stmt = $conn->prepare("DELETE FROM discord_link_codes WHERE code = ?");
        $stmt->execute([$code]);

        return ['success' => true, 'message' => 'เชื่อมบัญชี Discord สำเร็จ!', 'discord_id' => $discord_id];
    }

    return ['success' => false, 'message' => 'เกิดข้อผิดพลาด'];
}

// ============================================
// API Routes
// ============================================

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // [POST] สร้าง Link Code (เรียกจาก Bot)
    case 'generate':
        $api_key = $_POST['api_key'] ?? '';
        $discord_id = $_POST['discord_id'] ?? '';

        // ตรวจสอบ API Key (ใส่ใน config)
        $valid_key = 'YOUR_SECRET_API_KEY'; // เปลี่ยนเป็น key ของคุณ

        if ($api_key !== $valid_key) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }

        if (empty($discord_id)) {
            echo json_encode(['success' => false, 'message' => 'Missing discord_id']);
            exit;
        }

        $code = generate_link_code($discord_id);
        $link_url = "https://yoursite.com/api/discord_link.php?code=" . $code;

        echo json_encode([
            'success' => true,
            'code' => $code,
            'link' => $link_url,
            'expires_in' => 600 // 10 minutes
        ]);
        break;

    // [GET] เชื่อมบัญชี (User คลิกลิ้งค์)
    case '':
    default:
        $code = $_GET['code'] ?? '';

        if (empty($code)) {
            // แสดงหน้าแจ้งว่าต้องมี code
            ?>
            <!DOCTYPE html>
            <html lang="th">

            <head>
                <meta charset="UTF-8">
                <title>เชื่อมบัญชี Discord</title>
                <style>
                    body {
                        font-family: 'Kanit', sans-serif;
                        background: #1a1a2e;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }

                    .card {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 40px;
                        border-radius: 16px;
                        text-align: center;
                    }

                    .error {
                        color: #ff6b6b;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Kanit&display=swap" rel="stylesheet">
            </head>

            <body>
                <div class="card">
                    <h2 class="error">❌ ไม่พบรหัสเชื่อม</h2>
                    <p>กรุณาใช้คำสั่ง <code>/link</code> ในบอท Discord เพื่อรับลิ้งค์เชื่อมบัญชี</p>
                </div>
            </body>

            </html>
            <?php
            exit;
        }

        // ตรวจสอบว่า Login อยู่หรือไม่
        if (!isset($_SESSION['id'])) {
            // Redirect ไป Login พร้อม return URL
            header('Location: /?page=login&redirect=' . urlencode($_SERVER['REQUEST_URI']));
            exit;
        }

        $user_id = $_SESSION['id'];
        $result = link_account($code, $user_id);

        // แสดงผลลัพธ์
        ?>
        <!DOCTYPE html>
        <html lang="th">

        <head>
            <meta charset="UTF-8">
            <title>เชื่อมบัญชี Discord</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Kanit', sans-serif;
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }

                .card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    padding: 50px;
                    border-radius: 20px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    max-width: 400px;
                }

                .success {
                    color: #00d9ff;
                }

                .error {
                    color: #ff6b6b;
                }

                .icon {
                    font-size: 60px;
                    margin-bottom: 20px;
                }

                h2 {
                    margin-bottom: 15px;
                }

                p {
                    color: #aaa;
                    margin-bottom: 25px;
                }

                .btn {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(90deg, #00d9ff, #ff006e);
                    color: #fff;
                    text-decoration: none;
                    border-radius: 30px;
                    font-weight: 600;
                    transition: 0.3s;
                }

                .btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
                }

                .discord-id {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 10px 20px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-family: monospace;
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Kanit&display=swap" rel="stylesheet">
        </head>

        <body>
            <div class="card">
                <?php if ($result['success']): ?>
                    <div class="icon">✅</div>
                    <h2 class="success">
                        <?= htmlspecialchars($result['message']) ?>
                    </h2>
                    <div class="discord-id">Discord ID:
                        <?= htmlspecialchars($result['discord_id']) ?>
                    </div>
                    <p>ตอนนี้คุณสามารถเติมเงินผ่านบอท Discord และพอยท์จะเข้าบัญชีเว็บไซต์อัตโนมัติ!</p>
                    <a href="/?page=profile" class="btn">กลับหน้าโปรไฟล์</a>
                <?php else: ?>
                    <div class="icon">❌</div>
                    <h2 class="error">เชื่อมบัญชีไม่สำเร็จ</h2>
                    <p>
                        <?= htmlspecialchars($result['message']) ?>
                    </p>
                    <a href="/" class="btn">กลับหน้าหลัก</a>
                <?php endif; ?>
            </div>
        </body>

        </html>
        <?php
        break;
}
