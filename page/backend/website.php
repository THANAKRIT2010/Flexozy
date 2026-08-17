<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-browser text-xdvz-primary me-2"></i> จัดการเว็บไซต์
            </h3>
            <p class="text-muted small mb-0">ปรับแต่งข้อมูลพื้นฐาน สี และธีมของเว็บไซต์คุณ</p>
        </div>
        <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
            <i class="fa-solid fa-chart-line me-2"></i> สถิติโชว์
        </button>
    </div>

    <div class="row g-4">
        <!-- Main Form -->
        <div class="col-lg-8">
            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">ชื่อเว็บไซต์</label>
                <input type="text" id="site_name" class="form-control py-3" value="<?php echo $config['name']; ?>"
                    style="border-radius: 12px;">
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">ภาพ Logo (URL)</label>
                <input type="text" id="site_logo" class="form-control py-3" value="<?php echo $config['logo']; ?>"
                    style="border-radius: 12px;">
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <label class="form-label text-dark fw-bold small text-center d-block">สีหลัก (Primary)</label>
                    <input type="color" class="form-control form-control-color w-100 py-1" id="site_main_color"
                        value="<?php echo $config['main_color']; ?>" style="height: 60px; border-radius: 12px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label text-dark fw-bold small text-center d-block">สีรอง (Secondary)</label>
                    <input type="color" class="form-control form-control-color w-100 py-1" id="site_sec_color"
                        value="<?php echo $config['sec_color']; ?>" style="height: 60px; border-radius: 12px;">
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">โหมดการแสดงผล (Theme)</label>
                <div class="row g-3">
                    <div class="col-6">
                        <input type="radio" class="btn-check" name="theme_mode" id="theme_light" value="light" <?php if (($config['theme_mode'] ?? 'light') == 'light')
                            echo 'checked'; ?>>
                        <label class="btn btn-outline-warning w-100 py-3 fw-bold shadow-none" for="theme_light"
                            style="border-radius: 15px;">
                            <i class="fa-solid fa-sun me-2"></i> Light Mode
                        </label>
                    </div>
                    <div class="col-6">
                        <input type="radio" class="btn-check" name="theme_mode" id="theme_dark" value="dark" <?php if (($config['theme_mode'] ?? 'light') == 'dark')
                            echo 'checked'; ?>>
                        <label class="btn btn-outline-dark w-100 py-3 fw-bold shadow-none" for="theme_dark"
                            style="border-radius: 15px;">
                            <i class="fa-solid fa-moon me-2"></i> Dark Mode
                        </label>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">Webhook Discord</label>
                <input type="text" id="webhook_dc" class="form-control py-3"
                    value="<?php echo $config['webhook_dc']; ?>" style="border-radius: 12px;">
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">Discord Server ID (สำหรับ Widget ใน Footer)</label>
                <input type="text" id="discord_server" class="form-control py-3"
                    value="<?php echo $config['discord_server'] ?? ''; ?>" style="border-radius: 12px;"
                    placeholder="เช่น 123456789012345678">
                <small class="text-muted">หา Server ID: คลิกขวาที่เซิร์ฟเวอร์ > Copy Server ID</small>
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">เบอร์ Wallet (รับเงิน)</label>
                <input type="text" id="site_phone" class="form-control py-3" value="<?php echo $config['wallet']; ?>"
                    style="border-radius: 12px;">
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">ประกาศ (หน้าร้าน)</label>
                <input type="text" id="ann" class="form-control py-3" value="<?php echo $config['ann']; ?>"
                    style="border-radius: 12px;">
            </div>

            <div class="mb-4">
                <label class="form-label text-dark fw-bold small">คำอธิบายร้านค้า (Footer)</label>
                <textarea id="site_des" rows="5" class="form-control"
                    style="border-radius: 12px;"><?php echo $config['des']; ?></textarea>
            </div>

            <div class="mb-5 p-3 bg-light rounded-4 border d-flex align-items-center justify-content-between">
                <div>
                    <h6 class="fw-bold mb-1 text-dark">ระบบหักค่าธรรมเนียมสลิป</h6>
                    <p class="text-muted small mb-0">หัก 2.3% ไม่เกิน 10 บาทต่อรายการ</p>
                </div>
                <div class="form-check form-switch fs-4">
                    <input class="form-check-input" type="checkbox" role="switch" id="pc" <?php if ($config['fee'] == "on")
                        echo "checked"; ?>>
                </div>
            </div>

            <button class="btn btn-success w-100 py-3 fw-bold shadow-sm" id="btn_regis"
                style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border: none; border-radius: 12px;">
                <i class="fa-solid fa-save me-2"></i> บันทึกข้อมูลเว็บไซต์ทั้งหมด
            </button>
        </div>
    </div>
</div>

<!-- Modal สำหรับตั้งค่าจำนวน -->
<div class="modal fade" id="product_insert" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">ตั้งค่าสถิติการแสดงผล</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold"><i class="fa-solid fa-users me-1 text-xdvz-primary"></i>
                        เพิ่มจำนวนสมาชิก</label>
                    <input type="number" id="m_count" class="form-control py-2"
                        value="<?php echo $static['m_count'] ?? 0; ?>" placeholder="0">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold"><i
                            class="fa-solid fa-layer-group me-1 text-xdvz-primary"></i> เพิ่มจำนวนหมวดหมู่</label>
                    <input type="number" id="c_count" class="form-control py-2"
                        value="<?php echo $static['c_count'] ?? 0; ?>" placeholder="0">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold"><i class="fa-solid fa-box-open me-1 text-xdvz-primary"></i>
                        เพิ่มจำนวนสินค้าพร้อมขาย</label>
                    <input type="number" id="s_count" class="form-control py-2"
                        value="<?php echo $static['s_count'] ?? 0; ?>" placeholder="0">
                </div>
                <div class="mb-4">
                    <label class="form-label small fw-bold"><i class="fa-solid fa-check-circle me-1 text-success"></i>
                        เพิ่มจำนวนขายแล้ว</label>
                    <input type="number" id="sold_count" class="form-control py-2"
                        value="<?php echo $static['sold_count'] ?? 0; ?>" placeholder="0">
                </div>
                <div class="alert alert-info py-2 small mb-0">
                    <i class="fa-solid fa-info-circle me-1"></i> ค่าเหล่านี้จะถูกนำไปบวกรวมกับจำนวนจริงในระบบ
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-success w-100 py-2 rounded-3 fw-bold" id="insert_btn"
                    style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border: none;">บันทึกสถิติ</button>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    $("#open_insert").click(() => { new bootstrap.Modal('#product_insert').show(); });

    $("#insert_btn").click(function () {
        var formData = new FormData();
        formData.append('m_count', $("#m_count").val());
        formData.append('c_count', $("#c_count").val());
        formData.append('s_count', $("#s_count").val());
        formData.append('sold_count', $("#sold_count").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/static_udpate.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    $("#btn_regis").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('name', $("#site_name").val());
        formData.append('bg', 'no'); // Fixed BG for now
        formData.append('phone', $("#site_phone").val());
        formData.append('main_color', $("#site_main_color").val());
        formData.append('logo', $("#site_logo").val());
        formData.append('sec_color', $("#site_sec_color").val());
        formData.append('contact', $("#site_contact").val() || '#'); // Default if empty
        formData.append('theme_mode', $('input[name="theme_mode"]:checked').val());
        formData.append('des', $("#site_des").val());
        formData.append('ann', $("#ann").val());
        formData.append('webhook_dc', $("#webhook_dc").val());
        formData.append('discord_server', $("#discord_server").val());
        formData.append('fee', $('#pc').is(':checked') ? "on" : "off");

        Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => { Swal.showLoading() } });

        $.ajax({
            type: 'POST',
            url: 'system/backend/website.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        }).fail(function (jqXHR) {
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        });
    });
</script>