<?php
// Home Page - แสดงสินค้าและ Quick Navigation

// Get boost values from static table
$boost_members = 0;
$boost_categories = 0;
$boost_products = 0;
$boost_sold = 0;

$static_result = dd_q("SELECT * FROM static LIMIT 1");
if ($static_result && $static_result->rowCount() > 0) {
    $static_data = $static_result->fetch(PDO::FETCH_ASSOC);
    $boost_members = intval($static_data['m_count'] ?? 0);
    $boost_categories = intval($static_data['c_count'] ?? 0);
    $boost_products = intval($static_data['s_count'] ?? 0);
    $boost_sold = intval($static_data['sold_count'] ?? 0);
}

// Get real statistics
$real_users = 0;
$real_categories = 0;
$real_products = 0;
$real_sold = 0;

$users_result = dd_q("SELECT COUNT(*) as total FROM users");
if ($users_result)
    $real_users = intval($users_result->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

$cat_result = dd_q("SELECT COUNT(*) as total FROM category");
if ($cat_result)
    $real_categories = intval($cat_result->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

$stock_result = dd_q("SELECT COUNT(*) as total FROM box_stock");
if ($stock_result)
    $real_products = intval($stock_result->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

$sold_result = dd_q("SELECT COUNT(*) as total FROM boxlog");
if ($sold_result)
    $real_sold = intval($sold_result->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

// Combined totals
$total_users = $real_users + $boost_members;
$total_categories = $real_categories + $boost_categories;
$total_products = $real_products + $boost_products;
$total_sold = $real_sold + $boost_sold;
?>

<!-- Hero Banner Section -->
<div class="home-hero-banner">
    <div class="home-hero-particles"></div>
    <div class="container position-relative" style="z-index: 2;">
        <div class="text-center py-5">
            <img src="<?= htmlspecialchars($config['logo'] ?? '') ?>" alt="Logo" class="home-hero-logo mb-4">
            <h1 class="home-hero-title"><?= strtoupper($config['name']) ?></h1>
            <div class="home-hero-tagline">
                <span><?= $config['des'] ?></span>
            </div>
            <div class="home-hero-buttons mt-4">
                <a href="?page=shop" class="btn home-btn-primary mx-2">
                    <i class="fa-solid fa-shopping-bag me-2"></i>ดูสินค้าทั้งหมด
                </a>
                <a href="?page=topup" class="btn home-btn-outline mx-2">
                    <i class="fa-solid fa-wallet me-2"></i>เติมเงินพอยท์
                </a>
            </div>

            <?php if (!empty($config['ann'])): ?>
                <!-- Announcement Bar -->
                <div class="home-announcement-bar mt-4">
                    <div class="announcement-icon">
                        <i class="fa-solid fa-bullhorn"></i>
                    </div>
                    <div class="announcement-content">
                        <marquee behavior="scroll" direction="left" scrollamount="3">
                            <?= htmlspecialchars($config['ann']) ?>
                        </marquee>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <!-- Statistics Bar -->
        <div class="home-stats-bar mt-4">
            <div class="home-stat-item">
                <div class="home-stat-info">
                    <span class="home-stat-label">สมาชิก</span>
                    <span class="home-stat-value"><?= number_format($total_users) ?><small>คน</small></span>
                </div>
                <div class="home-stat-icon">
                    <i class="fa-solid fa-users"></i>
                </div>
            </div>
            <div class="home-stat-item">
                <div class="home-stat-info">
                    <span class="home-stat-label">หมวดหมู่</span>
                    <span class="home-stat-value"><?= number_format($total_categories) ?><small>กลุ่ม</small></span>
                </div>
                <div class="home-stat-icon">
                    <i class="fa-solid fa-layer-group"></i>
                </div>
            </div>
            <div class="home-stat-item">
                <div class="home-stat-info">
                    <span class="home-stat-label">พร้อมขาย</span>
                    <span class="home-stat-value"><?= number_format($total_products) ?><small>ชิ้น</small></span>
                </div>
                <div class="home-stat-icon">
                    <i class="fa-solid fa-box-open"></i>
                </div>
            </div>
            <div class="home-stat-item home-stat-highlight">
                <div class="home-stat-info">
                    <span class="home-stat-label">ขายแล้ว</span>
                    <span class="home-stat-value"><?= number_format($total_sold) ?><small>ชิ้น</small></span>
                </div>
                <div class="home-stat-icon">
                    <i class="fa-solid fa-check-circle"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="container-sm py-5">
    <!-- Announcement -->
    <?php if (!empty($config['ann'])): ?>
        <div class="announcement-bar shadow-sm mb-4">
            <div class="announcement-icon">
                <i class="fa-solid fa-bullhorn"></i>
            </div>
            <marquee class="flex-grow-1 fw-medium"><?= htmlspecialchars($config['ann']) ?></marquee>
        </div>
    <?php endif; ?>

    <!-- Featured Categories -->
    <div class="mb-5">
        <div class="d-flex justify-content-between align-items-end mb-4">
            <div>
                <h4 class="fw-bold mb-1"><i class="fa-solid fa-layer-group text-xez-primary me-2"></i>
                    หมวดหมู่แนะนำ</h4>
                <p class="text-muted small mb-0">เลือกชมสินค้าตามหมวดหมู่ที่คุณสนใจ</p>
            </div>
            <a href="?page=shop" class="btn xez-btn-outline btn-sm px-4">ดูทั้งหมด</a>
        </div>

        <div class="row g-4">
            <?php
            $cat_find = dd_q("SELECT * FROM category ORDER BY c_id DESC LIMIT 4");
            if ($cat_find && $cat_find->rowCount() > 0):
                while ($cat_row = $cat_find->fetch(PDO::FETCH_ASSOC)):
                    // Get item count for this category
                    $item_count_q = dd_q("SELECT COUNT(*) as cnt FROM box_product WHERE c_id = ?", [$cat_row["c_id"]]);
                    $item_count = $item_count_q ? $item_count_q->fetch(PDO::FETCH_ASSOC)['cnt'] : 0;
                    ?>
                    <div class="col-12 col-md-6">
                        <a href="?page=shop&category=<?= $cat_row['c_id'] ?>" class="text-decoration-none">
                            <div class="xez-card cat-card-horizontal">
                                <div class="cat-card-img">
                                    <img src="<?= htmlspecialchars($cat_row['img'] ?? '') ?>"
                                        alt="<?= htmlspecialchars($cat_row['c_name'] ?? '') ?>"
                                        onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                                </div>
                                <div class="cat-card-body">
                                    <div class="cat-card-info">
                                        <h5 class="fw-bold mb-1">
                                            <?= htmlspecialchars($cat_row['c_name'] ?? 'N/A') ?>
                                        </h5>
                                        <p class="text-muted small mb-0">
                                            <?= $item_count ?> รายการสินค้า
                                        </p>
                                    </div>
                                    <div class="cat-card-action">
                                        <i class="fa-solid fa-chevron-right text-xez-primary"></i>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                <?php endwhile;
            else: ?>
                <div class="col-12 text-center py-4 bg-light rounded-4 border border-dashed">
                    <p class="text-muted mb-0">ยังไม่มีหมวดหมู่แนะนำ</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Quick Navigation -->
    <div class="row g-3 mb-5">
        <div class="col-6 col-md-3">
            <a href="?page=shop" class="text-decoration-none">
                <div class="xez-card text-center py-4 home-nav-card">
                    <div class="home-nav-icon bg-primary-soft">
                        <i class="fa-solid fa-shop text-xez-primary"></i>
                    </div>
                    <h6 class="mb-0 fw-bold mt-3">เลือกซื้อสินค้า</h6>
                </div>
            </a>
        </div>
        <div class="col-6 col-md-3">
            <a href="?page=topup" class="text-decoration-none">
                <div class="xez-card text-center py-4 home-nav-card">
                    <div class="home-nav-icon bg-success-soft">
                        <i class="fa-solid fa-wallet text-success"></i>
                    </div>
                    <h6 class="mb-0 fw-bold mt-3">เติมเงิน</h6>
                </div>
            </a>
        </div>
        <div class="col-6 col-md-3">
            <a href="?page=redeem" class="text-decoration-none">
                <div class="xez-card text-center py-4 home-nav-card">
                    <div class="home-nav-icon" style="background: rgba(239, 68, 68, 0.1);">
                        <i class="fa-solid fa-gift text-danger"></i>
                    </div>
                    <h6 class="mb-0 fw-bold mt-3">แลกโค้ด</h6>
                </div>
            </a>
        </div>
        <div class="col-6 col-md-3">
            <a href="?page=slip" class="text-decoration-none">
                <div class="xez-card text-center py-4 home-nav-card">
                    <div class="home-nav-icon" style="background: rgba(59, 130, 246, 0.1);">
                        <i class="fa-solid fa-receipt text-info"></i>
                    </div>
                    <h6 class="mb-0 fw-bold mt-3">แจ้งโอนเงิน</h6>
                </div>
            </a>
        </div>
    </div>

    <!-- Featured Products -->
    <div class="mb-5">
        <div class="d-flex justify-content-between align-items-end mb-4">
            <div>
                <h4 class="fw-bold mb-1"><i class="fa-solid fa-fire-flame-curved text-xez-primary me-2"></i>
                    สินค้าแนะนำ</h4>
                <p class="text-muted small mb-0">สินค้ายอดนิยมในร้านของเรา</p>
            </div>
            <a href="?page=shop" class="btn xez-btn-outline btn-sm px-4">ดูทั้งหมด</a>
        </div>

        <div class="row g-4">
            <?php
            $find = dd_q("SELECT * FROM box_product ORDER BY id DESC LIMIT 8");
            if ($find && $find->rowCount() > 0):
                while ($row = $find->fetch(PDO::FETCH_ASSOC)):
                    $stock_q = dd_q("SELECT COUNT(*) as cnt FROM box_stock WHERE p_id = ?", [$row["id"]]);
                    $stock = $stock_q ? $stock_q->fetch(PDO::FETCH_ASSOC)['cnt'] : 0;
                    ?>
                    <div class="col-6 col-md-4 col-lg-3">
                        <a href="?page=product&id=<?= $row['id'] ?>" class="text-decoration-none">
                            <div class="xez-card h-100 p-3 text-center position-relative product-card">
                                <?php if ($row['price'] < 100): ?>
                                    <span class="badge bg-danger position-absolute"
                                        style="top: 15px; right: 15px; z-index: 5;">HOT</span>
                                <?php endif; ?>

                                <div class="mb-3 overflow-hidden rounded product-img-wrapper">
                                    <img src="<?= htmlspecialchars($row['img'] ?? '') ?>" class="w-100 h-100 product-img">
                                </div>

                                <h6 class="fw-bold mb-2 text-truncate"><?= htmlspecialchars($row['name'] ?? 'N/A') ?></h6>

                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="text-xez-primary fw-bold"><?= number_format($row['price'] ?? 0) ?> ฿</span>
                                    <span class="text-muted small"><?= $stock ?> ชิ้น</span>
                                </div>

                                <span class="btn xez-btn-cyan w-100">
                                    <i class="fa-solid fa-eye me-1"></i> ดูรายละเอียด
                                </span>
                            </div>
                        </a>
                    </div>
                    <?php
                endwhile;
            else:
                ?>
                <div class="col-12 text-center py-5">
                    <i class="fa-solid fa-box-open text-muted" style="font-size: 4rem;"></i>
                    <h5 class="text-muted mt-3">ยังไม่มีสินค้าในขณะนี้</h5>
                    <a href="?page=shop" class="btn xez-btn-cyan mt-3">
                        <i class="fa-solid fa-store me-2"></i>ไปหน้าร้านค้า
                    </a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<style>
    /* Hero Banner */
    .home-hero-banner {
        background: linear-gradient(180deg, #0a0a15 0%, #1a0a25 50%, #0f0f1a 100%);
        padding: 40px 0 60px;
        position: relative;
        overflow: hidden;
    }

    .home-hero-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.2), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.15), transparent),
            radial-gradient(2px 2px at 50px 160px, rgba(255, 255, 255, 0.2), transparent),
            radial-gradient(3px 3px at 200px 200px, rgba(200, 150, 255, 0.3), transparent);
        background-size: 300px 300px;
        animation: hero-sparkle 5s linear infinite;
    }

    @keyframes hero-sparkle {
        from {
            transform: translateY(0);
        }

        to {
            transform: translateY(-300px);
        }
    }

    .home-hero-logo {
        max-width: 150px;
        height: auto;
        filter: drop-shadow(0 10px 30px rgba(200, 100, 255, 0.4));
        animation: hero-float 3s ease-in-out infinite;
    }

    @keyframes hero-float {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-10px);
        }
    }

    .home-hero-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #fff !important;
        margin-bottom: 15px;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .home-hero-tagline {
        background: linear-gradient(135deg, var(--xez-primary) 0%, var(--xez-secondary) 100%);
        display: inline-block;
        padding: 10px 40px;
        border-radius: 50px;
        box-shadow: 0 8px 30px rgba(var(--xez-primary-rgb), 0.4);
    }

    .home-hero-tagline span {
        color: #fff;
        font-weight: 500;
    }

    .home-btn-primary {
        background: var(--xez-primary);
        color: #fff;
        padding: 12px 30px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 5px 25px rgba(var(--xez-primary-rgb), 0.4);
        transition: all 0.3s ease;
    }

    .home-btn-primary:hover {
        background: var(--xez-secondary);
        transform: translateY(-3px);
        color: #fff;
    }

    .home-btn-outline {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 12px 30px;
        border-radius: 12px;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
    }

    .home-btn-outline:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        transform: translateY(-3px);
    }

    /* Announcement Bar */
    .home-announcement-bar {
        display: flex;
        align-items: center;
        background: linear-gradient(135deg, rgba(var(--xez-primary-rgb), 0.2) 0%, rgba(var(--xez-primary-rgb), 0.1) 100%);
        border: 1px solid rgba(var(--xez-primary-rgb), 0.3);
        border-radius: 50px;
        padding: 10px 20px;
        backdrop-filter: blur(10px);
        max-width: 600px;
        margin: 0 auto;
    }

    .announcement-icon {
        background: var(--xez-primary);
        color: #fff;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        flex-shrink: 0;
        animation: pulse-announcement 2s ease-in-out infinite;
    }

    @keyframes pulse-announcement {

        0%,
        100% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.1);
        }
    }

    .announcement-content {
        flex: 1;
        overflow: hidden;
        color: #fff;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .announcement-content marquee {
        color: #fff;
    }

    /* Stats Bar */
    .home-stats-bar {
        display: flex;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .home-stat-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 25px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .home-stat-item:last-child {
        border-right: none;
    }

    .home-stat-info {
        display: flex;
        flex-direction: column;
    }

    .home-stat-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.75rem;
        margin-bottom: 4px;
    }

    .home-stat-value {
        color: var(--xez-primary);
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1;
    }

    .home-stat-value small {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        margin-left: 4px;
        font-weight: 400;
    }

    .home-stat-icon {
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
    }

    .home-stat-icon i {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .home-stat-highlight .home-stat-icon {
        background: var(--xez-primary);
    }

    .home-stat-highlight .home-stat-icon i {
        color: #fff;
    }

    /* Nav Cards */
    .home-nav-card {
        transition: all 0.3s ease;
    }

    .home-nav-card:hover {
        transform: translateY(-5px);
    }

    .home-nav-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }

    /* Product Cards */
    .product-card {
        transition: all 0.3s ease;
    }

    .product-card:hover {
        transform: translateY(-5px);
    }

    .product-img-wrapper {
        aspect-ratio: 1/1;
    }

    .product-img {
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .product-card:hover .product-img {
        transform: scale(1.08);
    }

    /* Footer */
    .home-footer {
        background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
        padding: 50px 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .home-hero-title {
            font-size: 1.8rem;
        }

        .home-hero-logo {
            max-width: 100px;
        }

        .home-stats-bar {
            flex-wrap: wrap;
            border-radius: 16px;
        }

        .home-stat-item {
            flex: 1 1 50%;
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .home-stat-item:nth-child(2) {
            border-right: none;
        }

        .home-stat-item:nth-child(3),
        .home-stat-item:nth-child(4) {
            border-bottom: none;
        }

        .home-stat-value {
            font-size: 1.4rem;
        }

        .home-hero-buttons .btn {
            margin-bottom: 10px;
        }
    }
</style>