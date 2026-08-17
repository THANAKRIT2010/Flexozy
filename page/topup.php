<?php if (!isset($_GET['sub'])): ?>
    <div class="container-sm mt-4">
        <div class="mb-4">
            <h2 class="fw-bold mb-0 text-dark"><i class="fa-solid fa-wallet text-xez-primary me-2"></i> ช่องทางการเติมเงิน (Payment Methods)
            </h2>
            <p class="text-muted small">เลือกช่องทางที่ต้องการเติมเงินเข้าสู่ระบบ</p>
        </div>

        <div class="row g-4 justify-content-center">
            <!-- SlipOK Auto Verification -->
            <div class="col-12 col-md-6 col-lg-4">
                <a href="?page=slip" class="text-decoration-none">
                    <div class="xez-card h-100 d-flex align-items-center p-3 border border-xez-primary" style="box-shadow: 0 4px 20px rgba(var(--xez-primary-rgb), 0.15);">
                        <div class="bg-primary-soft rounded-4 p-3 me-3 d-flex align-items-center justify-content-center"
                            style="width: 75px; height: 75px;">
                            <i class="fa-solid fa-receipt text-xez-primary display-6"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-1">
                                <h5 class="fw-bold text-dark mb-0 me-2">โอนเงิน / สแกนสลิป</h5>
                                <span class="badge bg-success small"><i class="fa-solid fa-bolt me-1"></i> อัตโนมัติ</span>
                            </div>
                            <p class="text-muted x-small mb-0">ระบบ SlipOK ตรวจสอบสลิป 24 ชม.</p>
                        </div>
                    </div>
                </a>
            </div>

            <!-- PromptPay QR Code -->
            <div class="col-12 col-md-6 col-lg-4">
                <a href="?page=topup&sub=promptpay" class="text-decoration-none">
                    <div class="xez-card h-100 d-flex align-items-center p-3">
                        <div class="bg-success-soft rounded-4 p-3 me-3 d-flex align-items-center justify-content-center"
                            style="width: 75px; height: 75px;">
                            <i class="fa-solid fa-qrcode text-success display-6"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-1">
                                <h5 class="fw-bold text-dark mb-0 me-2">PromptPay QR Code</h5>
                                <span class="badge bg-primary small"><i class="fa-solid fa-star me-1"></i> แนะนำ</span>
                            </div>
                            <p class="text-muted x-small mb-0">สร้าง QR ตามยอดเงินที่ระบุ + แนบสลิปอัตโนมัติ</p>
                        </div>
                    </div>
                </a>
            </div>

            <!-- TrueMoney Gift -->
            <div class="col-12 col-md-6 col-lg-4">
                <a href="?page=topup&sub=gift" class="text-decoration-none">
                    <div class="xez-card h-100 d-flex align-items-center p-3">
                        <div class="bg-dark rounded-4 p-3 me-3 d-flex align-items-center justify-content-center"
                            style="width: 75px; height: 75px;">
                            <img src="https://img2.pic.in.th/download7a68ea330c321b38.png" class="img-fluid"
                                alt="TrueMoney">
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="fw-bold text-dark mb-1">TrueMoney Wallet</h5>
                            <p class="text-muted x-small mb-0">ซองของขวัญอั่งเปา</p>
                        </div>
                    </div>
                </a>
            </div>

            <!-- Redeem Code -->
            <div class="col-12 col-md-6 col-lg-4">
                <a href="?page=redeem" class="text-decoration-none">
                    <div class="xez-card h-100 d-flex align-items-center p-3">
                        <div class="bg-warning-soft rounded-4 p-3 me-3 d-flex align-items-center justify-content-center"
                            style="width: 75px; height: 75px;">
                            <i class="fa-solid fa-ticket text-warning display-6"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="fw-bold text-dark mb-1">Redeem Code</h5>
                            <p class="text-muted x-small mb-0">กรอกโค้ดรับพ้อยท์ฟรี</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
<?php else: ?>
    <?php
    if ($_GET['sub'] == "gift") {
        require_once('page/topup_gift.php');
    } elseif ($_GET['sub'] == "promptpay") {
        require_once('page/topup_promptpay.php');
    }
    ?>
<?php endif; ?>

<style>
    .bg-success-soft {
        background-color: rgba(25, 135, 84, 0.1);
    }

    .bg-warning-soft {
        background-color: rgba(255, 193, 7, 0.1);
    }

    .bg-primary-soft {
        background-color: rgba(var(--xez-primary-rgb), 0.1);
    }

    .x-small {
        font-size: 0.75rem;
    }
</style>