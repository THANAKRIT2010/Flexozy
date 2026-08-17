<div class="container-sm py-5">
    <div class="row justify-content-center">
        <div class="col-lg-5 col-md-7">
            <div class="xdvz-card p-4 p-lg-5">
                <div class="text-center mb-4">
                    <div class="bg-primary-soft d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style="width: 70px; height: 70px;">
                        <i class="fa-solid fa-user-plus text-xdvz-primary fs-2"></i>
                    </div>
                    <h3 class="fw-bold mb-1">สร้างบัญชีใหม่</h3>
                    <p class="text-muted small">กรอกข้อมูลเพื่อสมัครสมาชิก</p>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">ชื่อผู้ใช้</label>
                    <input type="text" class="form-control py-2" id="user" placeholder="Username">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสผ่าน</label>
                    <input type="password" class="form-control py-2" id="pass" placeholder="Password">
                </div>
                <div class="mb-4">
                    <label class="form-label small fw-bold">ยืนยันรหัสผ่าน</label>
                    <input type="password" class="form-control py-2" id="pass2" placeholder="Confirm Password">
                </div>

                <div class="mb-4 d-flex justify-content-center">
                    <div id="capcha" class="g-recaptcha" data-theme="light"></div>
                </div>

                <button class="btn xdvz-btn-cyan w-100 py-3 fw-bold mb-3" id="btn_regis">
                    <i class="fa-solid fa-user-plus me-2"></i> สมัครสมาชิก
                </button>

                <div class="text-center">
                    <p class="text-muted small mb-0">
                        มีบัญชีอยู่แล้ว?
                        <a href="?page=login" class="text-xdvz-primary fw-bold">เข้าสู่ระบบ</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit" async defer></script>
<script>
    var onloadCallback = function () {
        grecaptcha.render('capcha', { 'sitekey': '<?= $conf['sitekey'] ?>' });
    };

    $("#btn_regis").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('user', $("#user").val());
        formData.append('pass', $("#pass").val());
        formData.append('pass2', $("#pass2").val());
        formData.append('captcha', grecaptcha.getResponse());
        $('#btn_regis').attr('disabled', 'disabled');

        $.ajax({
            type: 'POST',
            url: 'system/register.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            grecaptcha.reset();
            if (res.status == "success") {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => location.href = '?page=home');
            } else {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res.message });
                $('#btn_regis').removeAttr('disabled');
            }
        }).fail(function () {
            grecaptcha.reset();
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
            $('#btn_regis').removeAttr('disabled');
        });
    });

    $(function () {
        function rescaleCaptcha() {
            var width = $('.g-recaptcha').parent().width();
            var scale = width < 302 ? width / 302 : 1.0;
            $('.g-recaptcha').css({ 'transform': 'scale(' + scale + ')', 'transform-origin': '0 0' });
        }
        rescaleCaptcha();
        $(window).resize(rescaleCaptcha);
    });
</script>