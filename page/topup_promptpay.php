<?php
$bank = dd_q("SELECT * FROM bank WHERE 1")->fetch(PDO::FETCH_ASSOC);
$pp_id = !empty($bank['promptpay_id']) ? $bank['promptpay_id'] : $bank['bnum'];
$recipient_name = trim(($bank['fname'] ?? '') . ' ' . ($bank['lname'] ?? ''));
?>
<div class="container-sm mt-4">
    <div class="xez-card p-4">
        <div class="mb-4">
            <h4 class="fw-bold mb-1 text-dark"><i class="fa-solid fa-qrcode text-success me-2"></i> PromptPay QR Code</h4>
            <p class="text-secondary small">ระบุจำนวนเงิน ระบบจะสร้าง QR Code พร้อมยอดเงินและปุ่มแนบสลิปผ่าน SlipOK API อัตโนมัติ</p>
        </div>

        <div class="row justify-content-center g-4">
            <div class="col-lg-6">
                <!-- Config Card -->
                <div class="card border-0 bg-light rounded-4 p-4 mb-4">
                    <div class="mb-3">
                        <label class="form-label text-muted small">พร้อมเพย์ (PromptPay ID / Phone / Tax ID)</label>
                        <input type="text" class="form-control text-center fw-bold fs-5" value="<?= htmlspecialchars($pp_id) ?>" readonly disabled>
                    </div>

                    <div class="mb-3">
                        <label class="form-label text-muted small">ชื่อบัญชีผู้รับเงิน</label>
                        <input type="text" class="form-control text-center fw-bold" value="<?= htmlspecialchars($recipient_name) ?>" readonly disabled>
                    </div>

                    <div class="mb-3">
                        <label class="form-label text-dark fw-bold small">ระบุจำนวนเงินที่ต้องการเติม (บาท)</label>
                        <input type="number" id="promptpay_amount" min="1" step="0.01"
                            class="form-control text-center py-3 fs-3 fw-bold text-success" placeholder="0.00" style="border-radius: 12px;">
                    </div>

                    <button class="btn btn-success w-100 py-3 fw-bold rounded-3 shadow-sm fs-5" onclick="generateQR()">
                        <i class="fa-solid fa-qrcode me-2"></i> สร้าง QR Code พร้อมยอดเงิน
                    </button>
                </div>
            </div>

            <div class="col-lg-6 text-center" id="qr_result" style="display: none;">
                <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 text-center">
                    <h5 class="fw-bold text-dark mb-2">สแกนจ่ายเงินผ่านแอปธนาคาร</h5>
                    <p class="text-muted small mb-3">ยอดเงินโอน: <span class="fw-bold text-success fs-4" id="display_amount">0.00 ฿</span></p>
                    
                    <div class="d-flex justify-content-center mb-3">
                        <img id="qr_image" src="" class="img-fluid rounded-3 border p-2 bg-white shadow-sm" style="max-width: 250px;">
                    </div>

                    <p class="text-muted x-small mb-0">ชื่อบัญชีผู้รับ: <strong><?= htmlspecialchars($recipient_name) ?></strong></p>
                </div>

                <!-- SlipOK Upload Zone -->
                <label for="slipInput" class="upload-zone border-dashed rounded-4 p-4 text-center mb-4 d-block w-100" id="dropZone" style="cursor:pointer;">
                    <div id="uploadPlaceholder">
                        <i class="fa-solid fa-cloud-arrow-up text-success display-4 mb-2"></i>
                        <h6 class="fw-bold text-dark mb-1">โอนเงินแล้ว แนบสลิปที่นี่</h6>
                        <p class="text-muted x-small mb-0">ระบบ SlipOK ตรวจสอบสลิปและเติมเงินให้อัตโนมัติทันที</p>
                    </div>
                    <div id="previewZone" class="d-none">
                        <img id="slipPreview" class="img-fluid rounded-3 shadow-sm mb-2" style="max-height: 180px;">
                        <p class="text-muted x-small mb-0">คลิกเพื่อเปลี่ยนรูปสลิป</p>
                    </div>
                    <input type="file" id="slipInput" name="slipInput" accept="image/*" style="display:none;">
                </label>

                <button class="btn btn-success w-100 py-3 fw-bold rounded-3 fs-5 shadow-sm d-none" id="submitSlipBtn">
                    <i class="fa-solid fa-paper-plane me-2"></i> ตรวจสอบสลิปและเติมเงิน
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    let selectedFile = null;

    function generateQR() {
        let pp_id = "<?= preg_replace('/[^0-9]/', '', $pp_id) ?>";
        let amount = parseFloat($("#promptpay_amount").val());

        if (!amount || amount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาระบุจำนวนเงิน',
                text: 'ระบุจำนวนเงินที่ต้องการเติมก่อนสร้าง QR Code'
            });
            return;
        }

        let qr_url = "https://promptpay.io/" + pp_id + "/" + amount;

        $("#qr_image").attr("src", qr_url);
        $("#display_amount").text(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ฿');
        $("#qr_result").slideDown();

        $('html, body').animate({
            scrollTop: $("#qr_result").offset().top - 20
        }, 500);
    }

    $("#slipInput").change(function (e) {
        if (!e.target.files.length) return;
        selectedFile = e.target.files[0];
        const imageUrl = URL.createObjectURL(selectedFile);

        $("#slipPreview").attr("src", imageUrl);
        $("#uploadPlaceholder").addClass("d-none");
        $("#previewZone").removeClass("d-none");
        $("#submitSlipBtn").removeClass("d-none");
    });

    // Drag and Drop
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('slipInput');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('bg-light-soft');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-light-soft');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-light-soft');

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            $("#slipInput").trigger("change");
        }
    });

    $("#submitSlipBtn").click(function () {
        if (!selectedFile) {
            Swal.fire({ icon: 'warning', title: 'กรุณาแนบสลิป', text: 'เลือกรูปภาพสลิปโอนเงินก่อนกดตรวจสอบ' });
            return;
        }

        Swal.fire({
            title: 'กำลังตรวจสอบสลิปผ่าน SlipOK...',
            text: 'กรุณารอสักครู่ ระบบกำลังสื่อสารกับระบบธนาคาร',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        const formData = new FormData();
        formData.append('slip_image', selectedFile);

        $.ajax({
            type: 'POST',
            url: 'system/slip.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            if (res.status == 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'เติมเงินสำเร็จ!',
                    text: res.message
                }).then(() => location.href = '?page=home');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ตรวจสอบสลิปไม่ผ่าน',
                    text: res.message
                });
            }
        }).fail(function (jqXHR) {
            let res = jqXHR.responseJSON;
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: res ? res.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ตรวจสอบสลิปได้'
            });
        });
    });
</script>

<style>
    .cursor-pointer {
        cursor: pointer;
    }

    .upload-zone {
        transition: all 0.2s ease-in-out;
        background: rgba(25, 135, 84, 0.03);
    }

    .upload-zone:hover {
        background: rgba(25, 135, 84, 0.08);
        border-color: #198754 !important;
    }

    .bg-light-soft {
        background-color: rgba(25, 135, 84, 0.05) !important;
    }

    .border-dashed {
        border: 2px dashed #dee2e6 !important;
    }
</style>