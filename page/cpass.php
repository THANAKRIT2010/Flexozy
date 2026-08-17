<div class="p-2">
    <div class="mb-4">
        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-shield-halved text-xdvz-primary me-2"></i>
            เปลี่ยนรหัสผ่าน</h4>
        <p class="text-muted small">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเปลี่ยนรหัสผ่านใหม่เข้าสู่ระบบของคุณ</p>
    </div>

    <div class="mb-3">
        <label class="form-label text-dark fw-bold small">รหัสผ่านปัจจุบัน</label>
        <div class="input-group">
            <span class="input-group-text bg-light border-end-0" style="border-radius: 12px 0 0 12px;"><i
                    class="fa-solid fa-key text-muted"></i></span>
            <input type="password" class="form-control border-start-0 py-2" id="o_pass" placeholder="กรอกรหัสผ่านเก่า"
                style="border-radius: 0 12px 12px 0;">
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <label class="form-label text-dark fw-bold small">รหัสผ่านใหม่</label>
            <input type="password" class="form-control py-2" id="pass" placeholder="กําหนดรหัสผ่านใหม่"
                style="border-radius: 12px;">
        </div>
        <div class="col-md-6">
            <label class="form-label text-dark fw-bold small">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" class="form-control py-2" id="pass2" placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                style="border-radius: 12px;">
        </div>
    </div>

    <button id="btn_save_pass" class="btn xdvz-btn-cyan w-100 py-3 mt-2 fw-bold shadow-sm">
        <i class="fa-solid fa-floppy-disk me-2"></i> บันทึกข้อมูลรหัสผ่านใหม่
    </button>
</div>

<script type="text/javascript">
    $("#btn_save_pass").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('o_pass', $("#o_pass").val());
        formData.append('pass', $("#pass").val());
        formData.append('pass2', $("#pass2").val());

        if ($("#pass").val() == "" || $("#o_pass").val() == "") {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ' });
            return;
        }

        $('#btn_save_pass').attr('disabled', 'disabled');
        Swal.fire({
            title: 'กำลังบันทึก...',
            didOpen: () => { Swal.showLoading() }
        });

        $.ajax({
            type: 'POST',
            url: 'system/changepass.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            if (res.status == "success") {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
            } else {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res.message });
                $('#btn_save_pass').removeAttr('disabled');
            }
        }).fail(function () {
            Swal.fire({ icon: 'error', title: 'ขัดข้อง', text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
            $('#btn_save_pass').removeAttr('disabled');
        });
    });
</script>