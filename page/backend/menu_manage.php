<?php
$sub = $_GET['page'] ?? 'backend';
function isActive($page, $current)
{
    return $page == $current ? 'active' : '';
}
?>
<div class="container-fluid mt-4 mb-5">
    <div class="container ps-0 pe-0 m-auto">
        <div class="row g-4">
            <!-- Sidebar Navigation -->
            <div class="col-lg-3">
                <div class="xez-card p-3 admin-sidebar">
                    <div class="p-3 mb-3">
                        <h5 class="fw-bold text-dark mb-1"><i class="fa-solid fa-gears text-xez-primary me-2"></i>
                            ระบบหลังบ้าน</h5>
                        <p class="text-muted small mb-0">Management Console</p>
                    </div>

                    <div class="list-group list-group-flush">
                        <a href="?page=backend"
                            class="list-group-item list-group-item-action <?= isActive('backend', $sub) ?>">
                            <i class="fa-solid fa-chart-pie"></i> แดชบอร์ด
                        </a>
                        <a href="?page=website"
                            class="list-group-item list-group-item-action <?= isActive('website', $sub) ?>">
                            <i class="fa-solid fa-browser"></i> ตั้งค่าเว็บไซต์
                        </a>
                        <a href="?page=slip_manage"
                            class="list-group-item list-group-item-action <?= isActive('slip_manage', $sub) ?>">
                            <i class="fa-solid fa-receipt"></i> จัดการสลิป
                        </a>
                        <hr class="my-2 opacity-10">
                        <a href="?page=user_edit"
                            class="list-group-item list-group-item-action <?= isActive('user_edit', $sub) ?>">
                            <i class="fa-solid fa-users"></i> ผู้ใช้งาน
                        </a>
                        <a href="?page=category_manage"
                            class="list-group-item list-group-item-action <?= isActive('category_manage', $sub) ?>">
                            <i class="fa-solid fa-layer-group"></i> หมวดหมู่
                        </a>
                        <a href="?page=product_manage"
                            class="list-group-item list-group-item-action <?= isActive('product_manage', $sub) ?>">
                            <i class="fa-solid fa-box-open"></i> สินค้า
                        </a>
                        <a href="?page=stock_manage"
                            class="list-group-item list-group-item-action <?= isActive('stock_manage', $sub) ?>">
                            <i class="fa-solid fa-boxes-stacked"></i> สต็อกสินค้า
                        </a>
                        <a href="?page=apibyshop"
                            class="list-group-item list-group-item-action <?= isActive('apibyshop', $sub) ?>">
                            <i class="fa-solid fa-receipt"></i> SlipOK API
                        </a>
                        <a href="?page=code_manage"
                            class="list-group-item list-group-item-action <?= isActive('code_manage', $sub) ?>">
                            <i class="fa-solid fa-ticket"></i> โค้ดแลกพ้อยท์
                        </a>
                        <a href="?page=discount_manage"
                            class="list-group-item list-group-item-action <?= isActive('discount_manage', $sub) ?>">
                            <i class="fa-solid fa-percent"></i> โค้ดส่วนลดสินค้า
                        </a>
                        <a href="?page=popup_manage"
                            class="list-group-item list-group-item-action <?= isActive('popup_manage', $sub) ?>">
                            <i class="fa-solid fa-bullhorn"></i> ป๊อปอัพประกาศ
                        </a>
                        <hr class="my-2 opacity-10">
                        <a href="?page=backend_topup_history"
                            class="list-group-item list-group-item-action <?= isActive('backend_topup_history', $sub) ?>">
                            <i class="fa-solid fa-wallet"></i> ประวัติเติมเงิน
                        </a>
                        <a href="?page=backend_buy_history"
                            class="list-group-item list-group-item-action <?= isActive('backend_buy_history', $sub) ?>">
                            <i class="fa-solid fa-shopping-bag"></i> ประวัติสั่งซื้อ
                        </a>
                        <a href="?page=apibyshop_his"
                            class="list-group-item list-group-item-action <?= isActive('apibyshop_his', $sub) ?>">
                            <i class="fa-solid fa-clock-rotate-left"></i> ประวัติ Byshop
                        </a>
                        <hr class="my-2 opacity-10">
                        <a href="?page=carousel_manage"
                            class="list-group-item list-group-item-action <?= isActive('carousel_manage', $sub) ?>">
                            <i class="fa-solid fa-image"></i> รูปภาพสไลด์
                        </a>
                        <a href="?page=recom_manage"
                            class="list-group-item list-group-item-action <?= isActive('recom_manage', $sub) ?>">
                            <i class="fa-solid fa-star"></i> สินค้าแนะนำ
                        </a>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="col-lg-9">
                <div class="xez-card p-0 overflow-hidden" style="min-height: 70vh;">
                    <?php
                    $page = $_GET['page'] ?? 'backend';
                    $backend_pages = [
                        'backend' => 'page/backend/dashboard.php',
                        'user_edit' => 'page/backend/user_edit.php',
                        'category_manage' => 'page/backend/category.php',
                        'product_manage' => 'page/backend/product.php',
                        'stock_manage' => 'page/backend/stock.php',
                        'code_manage' => 'page/backend/code_manage.php',
                        'discount_manage' => 'page/backend/discount_manage.php',
                        'popup_manage' => 'page/backend/popup_manage.php',
                        'backend_buy_history' => 'page/backend/buy_history.php',
                        'backend_topup_history' => 'page/backend/topup_history.php',
                        'website' => 'page/backend/website.php',
                        'carousel_manage' => 'page/backend/carousel_manage.php',
                        'recom_manage' => 'page/backend/recom_manage.php',
                        'crecom_manage' => 'page/backend/crecom_manage.php',
                        'apibyshop' => 'page/backend/apibyshop.php',
                        'apibyshop_his' => 'page/backend/apibyshop_his.php',
                        'slip_manage' => 'page/backend/slip_manage.php'
                    ];

                    if (admin($user) && array_key_exists($page, $backend_pages)) {
                        require_once($backend_pages[$page]);
                    } else {
                        echo "<div class='p-5 text-center'><h3 class='text-muted'>ไม่พบหน้านี้หรือคุณไม่มีสิทธิ์เข้าถึง</h3></div>";
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>
</div>