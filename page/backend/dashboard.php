<?php
//topup by day
date_default_timezone_set("Asia/Bangkok");
$midnight = strtotime("today 00:00");
$date_day = date('Y-m-d H:i:s', $midnight);
$q_1 = dd_q("SELECT sum(amount) AS total FROM topup_his WHERE date > ?", [$date_day]);
$day = $q_1->fetch(PDO::FETCH_ASSOC);
if ($day["total"] == null)
    $day["total"] = "0.00";

// topup by month
$date_month = date('Y-m-01 H:i:s', $midnight);
$q_2 = dd_q("SELECT sum(amount) AS total FROM topup_his WHERE date > ?", [$date_month]);
$month = $q_2->fetch(PDO::FETCH_ASSOC);
if ($month["total"] == null)
    $month["total"] = "0.00";

// topup all
$q_3 = dd_q("SELECT sum(amount) AS total FROM topup_his ");
$topup = $q_3->fetch(PDO::FETCH_ASSOC);
if ($topup["total"] == null)
    $topup["total"] = "0.00";
?>

<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold mb-1"><i class="fa-solid fa-chart-pie text-xez-primary me-2"></i> แผงควบคุมระบบ (Dashboard)
        </h3>
        <p class="text-muted small">ภาพรวมสถิติการใช้งานและการทำรายการภายในร้านค้าของคุณ</p>
    </div>

    <!-- Stat Cards -->
    <div class="row g-4 mb-5">
        <div class="col-lg-4 col-md-6">
            <div class="stat-card">
                <div class="d-flex align-items-center mb-3">
                    <div class="stat-icon me-3">
                        <i class="fa-solid fa-calendar-day"></i>
                    </div>
                    <span class="text-muted small fw-bold">ยอดเติมวันนี้</span>
                </div>
                <h2 class="fw-bold mb-0"><?= number_format($day["total"], 2) ?>฿</h2>
            </div>
        </div>
        <div class="col-lg-4 col-md-6">
            <div class="stat-card">
                <div class="d-flex align-items-center mb-3">
                    <div class="stat-icon me-3">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>
                    <span class="text-muted small fw-bold">ยอดเติมเดือนนี้</span>
                </div>
                <h2 class="fw-bold mb-0"><?= number_format($month["total"], 2) ?>฿</h2>
            </div>
        </div>
        <div class="col-lg-4 col-md-6">
            <div class="stat-card">
                <div class="d-flex align-items-center mb-3">
                    <div class="stat-icon me-3">
                        <i class="fa-solid fa-vault"></i>
                    </div>
                    <span class="text-muted small fw-bold">ยอดเติมทั้งหมด</span>
                </div>
                <h2 class="fw-bold mb-0"><?= number_format($topup["total"], 2) ?>฿</h2>
            </div>
        </div>
    </div>

    <!-- Recent Transactions -->
    <div class="xez-card p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0"><i class="fa-solid fa-clock-rotate-left text-xez-primary me-2"></i>
                รายการเติมเงินล่าสุด</h5>
            <a href="?page=backend_topup_history" class="btn btn-light btn-sm rounded-pill px-3">ดูทั้งหมด</a>
        </div>
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th class="border-0 py-3 ps-3">ID</th>
                        <th class="border-0 py-3">ผู้ใช้งาน</th>
                        <th class="border-0 py-3">จำนวน</th>
                        <th class="border-0 py-3 pe-3 text-end">วันที่</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $f = dd_q("SELECT * FROM topup_his ORDER BY date DESC LIMIT 5");
                    while ($row = $f->fetch(PDO::FETCH_ASSOC)):
                        ?>
                        <tr class="align-middle">
                            <td class="py-3 ps-3 fw-bold">#<?= $row['id'] ?></td>
                            <td class="py-3">
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary-soft rounded-circle d-flex align-items-center justify-content-center me-2"
                                        style="width: 32px; height: 32px;">
                                        <i class="fa-solid fa-user text-xez-primary" style="font-size: 0.75rem;"></i>
                                    </div>
                                    <span class="fw-medium"><?= htmlspecialchars($row['uname']) ?></span>
                                </div>
                            </td>
                            <td class="py-3">
                                <span class="text-success fw-bold">+ ฿<?= number_format($row['amount'], 2) ?></span>
                            </td>
                            <td class="py-3 pe-3 text-end text-muted small"><?= $row['date'] ?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
