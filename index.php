<?php
session_start();
error_reporting(0);
require_once("system/a_func.php");
if (isset($_SESSION['id'])) {
    $q1 = dd_q("SELECT * FROM users WHERE id = ? LIMIT 1", [$_SESSION['id']]);
    if ($q1->rowCount() == 1) {
        $user = $q1->fetch(PDO::FETCH_ASSOC);
    } else {
        session_destroy();
        $_GET['page'] = "login";
    }
}
$get_static = dd_q("SELECT * FROM static");
$static = $get_static->fetch(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="<?php echo $config['name']; ?> | Homepage">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://<?php echo $config['name']; ?>.ovdc.xyz">
    <meta property="og:image" content="<?php echo $config['logo']; ?>">
    <meta property="og:description" content="<?php echo $config['des']; ?>">
    <title><?php echo $config['name']; ?></title>
    <link rel="shortcut icon" href="<?php echo $config['logo']; ?>" type="image/png" sizes="16x16">
    <link rel="stylesheet" href="system/css/second.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js"
        integrity="sha512-pumBsjNRGGqkPzKHndZMaAG+bir374sORyzM3uulLV14lN5LyykqNk8eEeUlUkB3U0M4FApyaHraT65ihJhDpQ=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="stylesheet" href="//cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
    <script src="//cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <link href="https://kit-pro.fontawesome.com/releases/v6.2.0/css/pro.min.css" rel="stylesheet">
    <script src="//cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600&family=Kanit&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="system/css/option.css">
    <style>
        <?php
        function hexToRgb($hex)
        {
            $hex = str_replace("#", "", $hex);
            if (strlen($hex) == 3) {
                $r = hexdec(substr($hex, 0, 1) . substr($hex, 0, 1));
                $g = hexdec(substr($hex, 1, 1) . substr($hex, 1, 1));
                $b = hexdec(substr($hex, 2, 1) . substr($hex, 2, 1));
            } else {
                $r = hexdec(substr($hex, 0, 2));
                $g = hexdec(substr($hex, 2, 2));
                $b = hexdec(substr($hex, 4, 2));
            }
            return "$r, $g, $b";
        }
        ?>
        /* Dynamic Color Injection from Database */
        :root {
            --xez-primary:
                <?= $config['main_color'] ?>
            ;
            --xez-primary-rgb:
                <?= hexToRgb($config['main_color']) ?>
            ;
            --xez-secondary:
                <?= $config['sec_color'] ?>
            ;
        }
    </style>
</head>

<body class="theme-<?= $config['theme_mode'] ?? 'light' ?>">
    <!-- Preloader -->
    <div id="preloader">
        <div class="loader-content">
            <div class="loader-logo">
                <img src="<?= $config['logo'] ?>" alt="Logo">
            </div>
            <div class="loader-bar">
                <div class="loader-progress"></div>
            </div>
            <p class="loader-text mt-3 fw-bold"><?= $config['name'] ?></p>
        </div>
    </div>
    <nav class="navbar navbar-expand-lg sticky-top main-navbar">
        <div class="container container-sm">
            <a class="navbar-brand d-flex align-items-center" href="?page=home">
                <img src="<?= $config['logo'] ?>" height="40px" width="auto" class="me-2">
                <span class="navbar-text-brand fw-bold"><?= $config['name'] ?></span>
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent">
                <i class="fa-solid fa-bars"></i>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mx-auto">
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="?page=home">
                            <i class="fa-solid fa-house me-1"></i> หน้าหลัก
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="?page=shop">
                            <i class="fa-solid fa-shopping-basket me-2"></i> สินค้าทั้งหมด
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="?page=topup">
                            <i class="fa-solid fa-coins me-1"></i> เติมเงิน
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="?page=redeem">
                            <i class="fa-solid fa-ticket me-1"></i> โค้ดส่วนลด
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="?page=how">
                            <i class="fa-solid fa-circle-question me-1"></i> วิธีใช้
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link-xez nav-link" href="<?= $config['contact'] ?>">
                            <i class="fa-solid fa-phone me-1"></i> ติดต่อ
                        </a>
                    </li>
                </ul>
                <div class="d-flex align-items-center">
                    <div class="nav-separator mx-3 d-none d-lg-block"></div>
                    <?php if (!isset($_SESSION['id'])): ?>
                        <a href="?page=login" class="nav-link-xez nav-link fw-bold me-3">
                            <i class="fa-solid fa-sign-in me-1"></i> เข้าสู่ระบบ
                        </a>
                        <a href="?page=register" class="btn btn-navbar-register">
                            <i class="fa-solid fa-user-plus me-1"></i> สมัครสมาชิก
                        </a>
                    <?php else: ?>
                        <div class="dropdown">
                            <a class="nav-link dropdown-toggle fw-bold" href="#" id="navbarDropdown" role="button"
                                data-bs-toggle="dropdown">
                                <i class="fa-solid fa-circle-user me-1"></i>
                                <?= htmlspecialchars($user["username"]) ?>
                                <span class="ms-1 text-xez-primary">(฿<?= number_format($user['point'], 2) ?>)</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-2">
                                <li><a class="dropdown-item rounded-3 mb-1" href="?page=profile"><i
                                            class="fa-solid fa-user me-2"></i> โปรไฟล์</a></li>
                                <li><a class="dropdown-item rounded-3 mb-1" href="?page=buyhis"><i
                                            class="fa-solid fa-clock-rotate-left me-2"></i> ประวัติสั่งซื้อ</a></li>
                                <li><a class="dropdown-item rounded-3 mb-1" href="?page=topuphis"><i
                                            class="fa-solid fa-receipt me-2"></i> ประวัติเติมเงิน</a></li>
                                <?php if ($user["rank"] == "1"): ?>
                                    <li><a class="dropdown-item text-primary rounded-3 mb-1" href="?page=backend"><i
                                                class="fa-solid fa-shield-halved me-2"></i> จัดการหลังร้าน</a></li>
                                <?php endif; ?>
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li><a class="dropdown-item text-danger rounded-3" href="?page=logout"><i
                                            class="fa-solid fa-sign-out me-2"></i> ออกจากระบบ</a></li>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <?php
    function admin($user)
    {
        return (isset($_SESSION['id']) && $user["rank"] == "1");
    }

    $page = $_GET['page'] ?? '';
    $backend_pages = ['backend', 'user_edit', 'category_manage', 'product_manage', 'stock_manage', 'code_manage', 'discount_manage', 'popup_manage', 'backend_buy_history', 'backend_topup_history', 'website', 'carousel_manage', 'recom_manage', 'crecom_manage', 'apibyshop', 'apibyshop_his', 'slip_manage'];
    $login_required_pages = ['profile', 'buyhis', 'topuphis', 'cpass', 'topup', 'slip', 'redeem', 'buyapp', 'myapp'];

    if ($page == "" || $page == "landing") {
        require_once('page/landing.php');
    } elseif ($page == "home") {
        require_once('page/simple.php');
    } elseif ($page == "login" && !isset($_SESSION['id'])) {
        require_once('page/login.php');
    } elseif ($page == "register" && !isset($_SESSION['id'])) {
        require_once('page/register.php');
    } elseif ($page == "logout" && isset($_SESSION['id'])) {
        session_destroy();
        echo "<script>window.location.href = './';</script>";
    } elseif (in_array($page, $login_required_pages) && !isset($_SESSION['id'])) {
        // Redirect to login if not authenticated
        echo "<script>window.location.href = '?page=login';</script>";
    } elseif ($page == "profile") {
        require_once('page/profile.php');
    } elseif ($page == "buyhis") {
        require_once('page/buyhis.php');
    } elseif ($page == "topuphis") {
        require_once('page/topuphis.php');
    } elseif ($page == "cpass") {
        require_once('page/cpass.php');
    } elseif ($page == "topup") {
        require_once('page/topup.php');
    } elseif ($page == "slip") {
        require_once('page/slip.php');
    } elseif ($page == "redeem") {
        require_once('page/redeem.php');
    } elseif ($page == "shop") {
        require_once('page/shop.php');
    } elseif ($page == "product" && isset($_GET['id'])) {
        require_once('page/product.php');
    } elseif ($page == "how") {
        require_once('page/how.php');
    } elseif ($page == "buyapp") {
        require_once('page/buyapp.php');
    } elseif ($page == "premiumapp") {
        require_once('page/premiumapp.php');
    } elseif ($page == "myapp") {
        require_once('page/myapp.php');
    } elseif (admin($user) && in_array($page, $backend_pages)) {
        require_once('page/backend/menu_manage.php');
    } else {
        require_once('page/landing.php');
    }
    ?>

    <!-- Modal Buy -->
    <div class="modal fade" id="buy_count" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold" id="modal_title">สั่งซื้อสินค้า</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label class="form-label text-muted small">จำนวนที่ต้องการสั่งซื้อ</label>
                        <input type="number" id="b_count" class="form-control text-center py-2" value="1"
                            style="border-radius: 10px;">
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted small">คงเหลือ: <span id="s" class="fw-bold text-dark">0</span>
                            ชิ้น</span>
                        <span class="badge bg-primary px-3 py-2" style="font-size: 1rem;">ราคา <span id="b">0</span>
                            ฿</span>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn xez-btn-cyan w-100" onclick="buybox()">ยืนยันการสั่งซื้อ</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Popup system removed -->

    <style>
        /* Multi-Page Popup Styles */
        .popup-content {
            border-radius: 24px !important;
            border: none !important;
            overflow: hidden;
            background: var(--bg-card);
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
        }

        .popup-slides {
            position: relative;
            overflow: hidden;
        }

        .popup-slide {
            display: none;
            animation: slideIn 0.4s ease;
        }

        .popup-slide.active {
            display: block;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(30px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .popup-image {
            max-height: 200px;
            overflow: hidden;
        }

        .popup-image img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .popup-body {
            padding: 24px;
            text-align: center;
        }

        .popup-badge {
            display: inline-block;
            background: linear-gradient(135deg, var(--xez-primary), var(--xez-secondary));
            color: #fff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 12px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {

            0%,
            100% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.05);
            }
        }

        .popup-title {
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text-heading);
        }

        .popup-text {
            color: var(--text-body);
            margin-bottom: 0;
        }

        .popup-indicators {
            display: flex;
            justify-content: center;
            gap: 8px;
            padding: 0 24px 16px;
        }

        .indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--border-main);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .indicator.active {
            width: 28px;
            border-radius: 10px;
            background: var(--xez-primary);
        }

        .popup-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background: var(--bg-card-alt);
            border-top: 1px solid var(--border-light);
        }

        .popup-btn {
            background: linear-gradient(135deg, var(--xez-primary), var(--xez-secondary));
            color: #fff;
            border: none;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .popup-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(var(--xez-primary-rgb), 0.4);
            color: #fff;
        }

        /* Floating Particles Effect */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }

        .particle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--xez-primary);
            border-radius: 50%;
            opacity: 0.15;
            animation: float 15s infinite;
        }

        @keyframes float {

            0%,
            100% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }

            10% {
                opacity: 0.15;
            }

            90% {
                opacity: 0.15;
            }

            100% {
                transform: translateY(-100vh) rotate(720deg);
                opacity: 0;
            }
        }
    </style>

    <script>
        $(document).ready(function () {
            // Only show popup on home page
            const urlParams = new URLSearchParams(window.location.search);
            const currentPage = urlParams.get('page') || 'home';
            let currentSlide = 1;
            const totalSlides = parseInt($('#popupNextBtn').data('total')) || 1;

            if (currentPage === 'home') {
                const popupShown = localStorage.getItem('xez_popup_shown');
                const now = new Date().getTime();
                if (!popupShown || now > parseInt(popupShown)) {
                    setTimeout(() => {
                        if ($('#xez_popup').length) {
                            new bootstrap.Modal('#xez_popup').show();
                        }
                    }, 500);
                }

                // Add floating particles
                createParticles();
            }

            // Popup navigation
            $('#popupNextBtn').click(function () {
                // If only 1 popup or on last slide, close it
                if (totalSlides === 1 || currentSlide >= totalSlides) {
                    // Save preference
                    if ($('#dontShowAgain').is(':checked')) {
                        localStorage.setItem('xez_popup_shown', new Date().getTime() + (3600 * 1000));
                    }
                    bootstrap.Modal.getInstance('#xez_popup').hide();
                } else {
                    // Go to next slide
                    currentSlide++;
                    updateSlide();
                }
            });

            // Indicator clicks
            $('.indicator').click(function () {
                currentSlide = parseInt($(this).data('target'));
                updateSlide();
            });

            function updateSlide() {
                // Update slides
                $('.popup-slide').removeClass('active');
                $(`.popup-slide[data-slide="${currentSlide}"]`).addClass('active');

                // Update indicators
                $('.indicator').removeClass('active');
                $(`.indicator[data-target="${currentSlide}"]`).addClass('active');

                // Update button text
                if (currentSlide === totalSlides) {
                    $('#popupNextBtn .btn-text').text('ปิด');
                    $('#popupNextBtn i').removeClass('fa-arrow-right').addClass('fa-times');
                } else {
                    $('#popupNextBtn .btn-text').text('ถัดไป');
                    $('#popupNextBtn i').removeClass('fa-times').addClass('fa-arrow-right');
                }
            }

            // Create floating particles
            function createParticles() {
                const container = $('<div class="particles"></div>');
                for (let i = 0; i < 15; i++) {
                    const particle = $('<div class="particle"></div>');
                    particle.css({
                        left: Math.random() * 100 + '%',
                        animationDelay: Math.random() * 15 + 's',
                        animationDuration: (15 + Math.random() * 10) + 's',
                        width: (4 + Math.random() * 8) + 'px',
                        height: (4 + Math.random() * 8) + 'px'
                    });
                    container.append(particle);
                }
                $('body').append(container);
            }
        });

        function tobuy(id, name, s, b) {
            $("#modal_title").text(name);
            $("#shop-btn").attr("data-id", id);
            $("#s").text(s);
            $("#b").text(b);
            new bootstrap.Modal('#buy_count').show();
        }

        function buybox() {
            const formData = new FormData();
            formData.append('id', $("#shop-btn").attr("data-id"));
            formData.append('count', $("#b_count").val());
            Swal.fire({
                title: 'ยืนยันการสั่งซื้อ?',
                text: "คุณต้องการสั่งซื้อสินค้านี้ใช่หรือไม่",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'ซื้อเลย',
                cancelButtonText: 'ยกเลิก'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        type: 'POST',
                        url: 'system/buybox.php',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: function (res) {
                            if (res.status == "success") {
                                Swal.fire('สำเร็จ', res.message, 'success').then(() => window.location.reload());
                            } else {
                                Swal.fire('ล้มเหลว', res.message, 'error');
                            }
                        }
                    });
                }
            });
        }
        AOS.init();
    </script>

    <!-- Footer Section -->
    <?php if ($page != "" && $page != "landing"): ?>
        <footer class="site-footer">
            <div class="container">
                <div class="row g-4">
                    <!-- Logo & Description -->
                    <div class="col-lg-4 col-md-6">
                        <div class="footer-brand">
                            <img src="<?= $config['logo'] ?>" alt="Logo" class="footer-logo">
                            <h4 class="footer-title">
                                <?= $config['name'] ?>
                            </h4>
                            <p class="footer-desc">
                                <?= $config['des'] ?>
                            </p>
                        </div>
                    </div>

                    <!-- Menu Links -->
                    <div class="col-lg-2 col-md-6">
                        <h5 class="footer-heading">เมนูหลัก</h5>
                        <ul class="footer-links">
                            <li><a href="?page=home"><i class="fa-solid fa-home me-2"></i>หน้าหลัก</a></li>
                            <li><a href="?page=shop"><i class="fa-solid fa-shopping-bag me-2"></i>สินค้า</a></li>
                            <li><a href="?page=topup"><i class="fa-solid fa-wallet me-2"></i>เติมเงิน</a></li>
                            <li><a href="?page=login"><i class="fa-solid fa-sign-in me-2"></i>เข้าสู่ระบบ</a></li>
                        </ul>
                    </div>

                    <!-- History Links -->
                    <div class="col-lg-2 col-md-6">
                        <h5 class="footer-heading">ประวัติต่างๆ</h5>
                        <ul class="footer-links">
                            <li><a href="?page=buyhis"><i class="fa-solid fa-history me-2"></i>ประวัติซื้อสินค้า</a></li>
                            <li><a href="?page=topuphis"><i class="fa-solid fa-receipt me-2"></i>ประวัติเติมเงิน</a></li>
                        </ul>
                    </div>

                    <!-- Social Widgets -->
                    <div class="col-lg-4 col-md-6">
                        <h5 class="footer-heading">ติดตามเรา</h5>
                        <div class="discord-card p-4 rounded-4 position-relative overflow-hidden" style="background: linear-gradient(135deg, #1e1f29 0%, #14151e 100%); border: 1px solid rgba(88, 101, 242, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                            <div class="d-flex align-items-center mb-3">
                                <div class="discord-icon-wrapper p-3 rounded-circle me-3" style="background: #5865F2; color: #fff; width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);">
                                    <i class="fa-brands fa-discord fs-2"></i>
                                </div>
                                <div>
                                    <h5 class="fw-bold text-white mb-0">CYGNUSXSTORE</h5>
                                    <div class="d-flex align-items-center mt-1">
                                        <span class="pulse-dot me-2" style="width: 10px; height: 10px; background-color: #23a55a; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #23a55a;"></span>
                                        <small class="text-muted fw-semibold">Community & Support</small>
                                    </div>
                                </div>
                            </div>
                            <p class="text-muted small mb-4">เข้ามาร่วมพูดคุย ติดตามข่าวสารโปรโมชั่น และรับบริการช่วยเหลือจากทีมงานของเราได้ที่ Discord ชุมชนหลัก</p>
                            <a href="https://discord.gg/4CTQcaRPPc" target="_blank" class="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center text-white" style="background: #5865F2; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(88, 101, 242, 0.4);">
                                <i class="fa-brands fa-discord me-2 fs-5"></i> เข้าร่วมดิสคอร์ด (Join Server)
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            <!-- Copyright -->
            <div class="footer-bottom">
                <p>&copy;
                    <?= date('Y') ?>
                    <?= $config['name'] ?>. All rights reserved.
                </p>
                <p class="small opacity-75">Powered by CYGNUSXSTORE</p>
            </div>
            </div>
        </footer>
    <?php endif; ?>

    <style>
        /* Footer Styles */
        .site-footer {
            background: linear-gradient(135deg, var(--xez-primary) 0%, var(--xez-secondary) 100%);
            padding: 60px 0 30px;
            margin-top: 60px;
            color: #fff;
        }

        .footer-brand .footer-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 15px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .footer-title {
            font-weight: 700;
            color: #fff;
            margin-bottom: 10px;
        }

        .footer-desc {
            color: #94a3b8;
            font-size: 0.9rem;
            line-height: 1.6;
        }

        .footer-heading {
            color: var(--xez-primary);
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 1rem;
        }

        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-links li {
            margin-bottom: 10px;
        }

        .footer-links a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .footer-links a:hover {
            color: var(--xez-primary);
            padding-left: 5px;
        }

        .widget-box {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 15px;
        }

        .widget-header {
            background: linear-gradient(135deg, #5865F2, #7289da);
            padding: 10px 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .widget-header i {
            font-size: 1.2rem;
        }

        .widget-content iframe {
            display: block;
        }

        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 40px;
            padding-top: 30px;
            text-align: center;
            color: #64748b;
        }

        .footer-bottom p {
            margin: 5px 0;
        }
    </style>
    <script>
        AOS.init({
            duration: 800,
            once: true
        });

        // Optimized Preloader Logic
        (function () {
            const preloader = document.getElementById('preloader');
            const progress = document.querySelector('.loader-progress');

            // Initial progress animation
            if (progress) {
                setTimeout(() => progress.style.width = '30%', 100);
                setTimeout(() => progress.style.width = '70%', 500);
            }

            function hidePreloader() {
                if (!preloader || preloader.style.display === 'none') return;

                if (progress) progress.style.width = '100%';

                setTimeout(() => {
                    preloader.classList.add('fade-out');
                    setTimeout(() => {
                        preloader.style.display = 'none';
                    }, 400);
                }, 200);
            }

            // Hide when loaded or after a safe timeout
            window.addEventListener('load', hidePreloader);
            setTimeout(hidePreloader, 2500); // 2.5s absolute maximum wait
        })();
    </script>
</body>

</html>