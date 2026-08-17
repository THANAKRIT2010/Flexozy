<div class="container-sm mt-4">
    <div class="xdvz-card p-4">
        <div class="mb-4">
            <h4 class="fw-bold mb-1 text-dark">Topup Wallet Gift</h4>
            <p class="text-secondary small">เติมเงินด้วยระบบซองของขวัญ อั่งเปา</p>
        </div>

        <div class="text-center mb-4">
            <img src="assets/img/topup.png" class="img-fluid rounded-4 shadow-sm" style="max-height: 400px;"
                alt="Instructions">
        </div>

        <div class="col-lg-8 mx-auto">
            <div class="mb-3">
                <input type="text" id="link" class="form-control text-center py-3 fs-5"
                    style="border-radius: 15px; border: 2px solid var(--xdvz-border);" placeholder="ลิงค์ซองของขวัญ">
            </div>

            <?php if ($config['fee'] == "on"): ?>
                <p class="text-center text-danger fw-bold mb-4">ค่าธรรมเนียม 2.9 % สูงสุด 10 บาท</p>
            <?php else: ?>
                <p class="text-center text-success fw-bold mb-4 fee-flash">ค่าธรรมเนียมฟรี</p>
            <?php endif; ?>

            <div class="row g-2">
                <div class="col-12 col-md-6">
                    <button class="btn btn-topup-confirm w-100 py-3" id="topup_btn">
                        <i class="fa-solid fa-check-circle me-2"></i> ยืนยันการเติมเงิน
                    </button>
                </div>
                <div class="col-12 col-md-6">
                    <a href="?page=topup" class="btn btn-danger w-100 py-3" style="border-radius: 10px;">
                        <i class="fa-solid fa-xmark-circle me-2"></i> ยกเลิกรายการ
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    $("#topup_btn").click(function () {
        var link = $("#link").val();
        if (link == "") {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกลิงค์ซองของขวัญ' });
            return;
        }

        var formData = new FormData();
        formData.append('link', link);

        Swal.fire({
            title: 'กำลังตรวจสอบ...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        $.ajax({
            type: 'POST',
            url: 'system/topup.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({
                icon: 'success',
                title: 'เติมเงินสำเร็จ',
                text: res.message
            }).then(function () {
                window.location = "?page=home";
            });
        }).fail(function (jqXHR) {
            var res = jqXHR.responseJSON;
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: res ? res.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
            });
        });
    });
</script>