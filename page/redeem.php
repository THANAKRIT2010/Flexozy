<div class="container-sm mt-4">
    <div class="xdvz-card p-4">
        <div class="mb-4">
            <h4 class="fw-bold mb-1 text-dark">Redeem Code</h4>
            <p class="text-xdvz-primary small fw-bold"># กรอกโค้ดเพื่อรับรางวัลจากเว็บของเรา</p>
        </div>

        <div class="text-center mb-4">
            <div class="bg-light d-inline-block p-4 rounded-circle mb-3 shadow-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/1162/1162456.png" class="img-fluid"
                    style="width: 100px;" alt="Gift">
            </div>
            <p class="text-muted small">* แต่ละโค้ดสามารถใช้งานได้หนึ่งครั้งต่อหนึ่งบัญชี</p>
        </div>

        <div class="col-lg-8 mx-auto">
            <div class="mb-3">
                <input type="text" id="redeem_code" class="form-control text-center py-3 fs-5"
                    style="border-radius: 15px; border: 2px solid var(--xdvz-border);" placeholder="กรอกโค้ดที่นี่">
            </div>

            <div class="row g-2">
                <div class="col-12 col-md-6">
                    <button class="btn xdvz-btn-cyan w-100 py-3 fw-bold" id="redeem_btn">
                        <i class="fa-solid fa-gift me-2"></i> แลกรับรางวัล
                    </button>
                </div>
                <div class="col-12 col-md-6">
                    <a href="?page=topup" class="btn btn-danger w-100 py-3 fw-bold" style="border-radius: 10px;">
                        <i class="fa-solid fa-arrow-left-long me-2"></i> กลับหนาเติมเงิน
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    $("#redeem_btn").click(function () {
        var code = $("#redeem_code").val();
        if (code == "") {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกโค้ด' });
            return;
        }

        var formData = new FormData();
        formData.append('link', code);

        Swal.fire({
            title: 'กำลังตรวจสอบโค้ด...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        $.ajax({
            type: 'POST',
            url: 'system/redeem.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({
                icon: 'success',
                title: 'แลกรางวัลสำเร็จ',
                text: res.message
            }).then(function () {
                window.location.reload();
            });
        }).fail(function (jqXHR) {
            var res = jqXHR.responseJSON;
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: res ? res.message : 'ไม่สามารถตรวจสอบโค้ดได้'
            });
        });
    });
</script>