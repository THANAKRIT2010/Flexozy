<div class="container-sm mt-4 mb-5">
    <div class="row g-4">
        <!-- Sidebar / User Info -->
        <div class="col-lg-4">
            <div class="xez-card p-4 mb-4">
                <div class="text-center mb-4">
                    <div class="bg-light-soft d-inline-block p-4 rounded-circle mb-3 shadow-sm"
                        style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-circle-user text-xez-primary display-4"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-1"><?= htmlspecialchars($user['username']) ?></h4>
                    <span class="badge bg-success-soft text-success rounded-pill px-3 py-2 small">Member Account</span>
                </div>

                <hr class="border-secondary opacity-10 my-4">

                <div class="list-group list-group-flush border-0">
                    <a href="?page=profile&subpage=buyhis"
                        class="list-group-item list-group-item-action border-0 rounded-3 mb-2 p-3 d-flex align-items-center <?= ($_GET['subpage'] ?? '') == 'buyhis' ? 'active-menu' : 'text-secondary' ?>">
                        <div class="menu-icon me-3"><i class="fa-solid fa-clock-rotate-left"></i></div>
                        <span class="fw-bold">ประวัติการสั่งซื้อ</span>
                    </a>
                    <a href="?page=profile&subpage=topuphis"
                        class="list-group-item list-group-item-action border-0 rounded-3 mb-2 p-3 d-flex align-items-center <?= ($_GET['subpage'] ?? '') == 'topuphis' ? 'active-menu' : 'text-secondary' ?>">
                        <div class="menu-icon me-3"><i class="fa-solid fa-coins"></i></div>
                        <span class="fw-bold">ประวัติเติมเงิน</span>
                    </a>
                    <a href="?page=profile&subpage=cpass"
                        class="list-group-item list-group-item-action border-0 rounded-3 mb-2 p-3 d-flex align-items-center <?= ($_GET['subpage'] ?? '' == 'cpass' || !isset($_GET['subpage'])) ? 'active-menu' : 'text-secondary' ?>">
                        <div class="menu-icon me-3"><i class="fa-solid fa-shield-halved"></i></div>
                        <span class="fw-bold">เปลี่ยนรหัสผ่าน</span>
                    </a>
                </div>

                <div class="mt-4 p-3 bg-light rounded-4 border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small">ยอดเงินคงเหลือ</span>
                        <h5 class="fw-bold text-dark mb-0">฿<?= number_format($user['point'], 2) ?></h5>
                    </div>
                    <a href="?page=topup" class="btn xez-btn-cyan w-100 btn-sm mt-3 py-2 rounded-3">เติมเงินตอนนี้</a>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="col-lg-8">
            <div class="xez-card p-4 min-vh-50">
                <?php
                $sub = $_GET['subpage'] ?? 'cpass';
                $pages = [
                    'cpass' => 'page/cpass.php',
                    'topuphis' => 'page/topuphis.php',
                    'buyhis' => 'page/buyhis.php'
                ];
                if (array_key_exists($sub, $pages)) {
                    require_once($pages[$sub]);
                } else {
                    require_once('page/cpass.php');
                }
                ?>
            </div>
        </div>
    </div>
</div>

<style>
    .active-menu {
        background-color: rgba(var(--xez-primary-rgb), 0.1) !important;
        color: var(--xez-primary) !important;
        border-left: 4px solid var(--xez-primary) !important;
    }

    .menu-icon {
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--xez-primary-rgb), 0.05);
        border-radius: 8px;
    }

    .active-menu .menu-icon {
        background: var(--xez-primary);
        color: #fff;
    }

    .min-vh-50 {
        min-height: 50vh;
    }
</style>