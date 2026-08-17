<?php 
$bank = dd_q("SELECT * FROM bank WHERE 1")->fetch(PDO::FETCH_ASSOC); 
$setting = dd_q("SELECT * FROM setting WHERE 1")->fetch(PDO::FETCH_ASSOC);
?>
<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-receipt text-xez-primary me-2"></i>
            จัดการระบบตรวจสอบสลิป (SlipOK API)</h3>
        <p class="text-muted small">ตั้งค่า SlipOK API Key, Branch ID และข้อมูลบัญชีเพื่อเปิดใช้ระบบเติมเงินอัตโนมัติ</p>
    </div>

    <div class="row g-4">
        <div class="col-lg-7">
            <!-- SlipOK API Card -->
            <div class="card border-0 bg-light rounded-4 p-4 mb-4">
                <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-key text-xez-primary me-2"></i> ตั้งค่า SlipOK API</h5>
                
                <div class="mb-3">
                    <label class="form-label text-dark fw-bold small">SlipOK API Key</label>
                    <input type="text" id="slip_api_key" class="form-control py-3" value="<?php echo htmlspecialchars($setting['slip_api_key'] ?? ''); ?>"
                        placeholder="เช่น SLIPOKX0VSODQ" style="border-radius: 12px;">
                    <div class="form-text text-muted small mt-1">นำมาจากเมนู API Key ในเว็บไซต์ SlipOK</div>
                </div>

                <div class="mb-3">
                    <label class="form-label text-dark fw-bold small">SlipOK URL / Branch ID</label>
                    <input type="text" id="slip_api_branch" class="form-control py-3" value="<?php echo htmlspecialchars($setting['slip_api_branch'] ?? ''); ?>"
                        placeholder="เช่น 71124" style="border-radius: 12px;">
                    <div class="form-text text-muted small mt-1">เลขไอดีสาขา หรือ เลขต่อท้าย URL เช่น 71124</div>
                </div>
            </div>

            <!-- Bank Account Info Card -->
            <div class="card border-0 bg-light rounded-4 p-4 mb-4">
                <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-building-columns text-xez-primary me-2"></i> ข้อมูลบัญชีแสดงหน้าร้าน</h5>

                <div class="mb-3">
                    <label class="form-label text-dark fw-bold small">ธนาคาร (Bank Name)</label>
                    <select id="tname" class="form-select py-3" style="border-radius: 12px;">
                        <option value="กรุงไทย" <?php echo ($bank['tname'] == 'กรุงไทย') ? 'selected' : ''; ?>>ธนาคารกรุงไทย (Krungthai)</option>
                        <option value="กสิกรไทย" <?php echo ($bank['tname'] == 'กสิกรไทย') ? 'selected' : ''; ?>>ธนาคารกสิกรไทย (K-Bank)</option>
                        <option value="ไทยพาณิชย์" <?php echo ($bank['tname'] == 'ไทยพาณิชย์') ? 'selected' : ''; ?>>ธนาคารไทยพาณิชย์ (SCB)</option>
                        <option value="ออมสิน" <?php echo ($bank['tname'] == 'ออมสิน') ? 'selected' : ''; ?>>ธนาคารออมสิน (GSB)</option>
                        <option value="ทหารไทยธนชาต" <?php echo ($bank['tname'] == 'ทหารไทยธนชาต') ? 'selected' : ''; ?>>ธนาคารทหารไทยธนชาต (ttb)</option>
                        <option value="กรุงเทพ" <?php echo ($bank['tname'] == 'กรุงเทพ') ? 'selected' : ''; ?>>ธนาคารกรุงเทพ (BBL)</option>
                        <option value="กรุงศรี" <?php echo ($bank['tname'] == 'กรุงศรี') ? 'selected' : ''; ?>>ธนาคารกรุงศรี (BAY)</option>
                    </select>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label text-dark fw-bold small">ชื่อจริง</label>
                        <input type="text" id="fname" class="form-control py-3" value="<?php echo htmlspecialchars($bank['fname'] ?? ''); ?>"
                            placeholder="เช่น วรกฤต" style="border-radius: 12px;">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-dark fw-bold small">นามสกุล</label>
                        <input type="text" id="lname" class="form-control py-3" value="<?php echo htmlspecialchars($bank['lname'] ?? ''); ?>"
                            placeholder="เช่น เฮียนฮะ" style="border-radius: 12px;">
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label text-dark fw-bold small">เลขบัญชีธนาคาร (Account Number)</label>
                    <input type="text" id="bnum" class="form-control py-3" value="<?php echo htmlspecialchars($bank['bnum'] ?? ''); ?>"
                        placeholder="เช่น 6623126740" style="border-radius: 12px;">
                </div>

                <div class="mb-3">
                    <label class="form-label text-dark fw-bold small">เบอร์ PromptPay</label>
                    <input type="text" id="promptpay_id" class="form-control py-3"
                        value="<?php echo htmlspecialchars($bank['promptpay_id'] ?? ''); ?>" placeholder="เช่น 0910616047"
                        style="border-radius: 12px;">
                </div>
            </div>

            <button class="btn btn-success w-100 py-3 fw-bold shadow-sm" id="btn_save_bank"
                style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border: none; border-radius: 12px;">
                <i class="fa-solid fa-save me-2"></i> บันทึกการตั้งค่า SlipOK และข้อมูลธนาคาร
            </button>
        </div>

        <div class="col-lg-5">
            <div class="p-4 bg-light rounded-4 border">
                <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-circle-info me-2 text-xez-primary"></i>
                    คำแนะนำการเชื่อมต่อ SlipOK</h6>
                <ul class="text-muted small ps-3 mb-0">
                    <li class="mb-2">นำ **API Key** จากหน้าตั้งค่าของ SlipOK มาวางในช่องด้านบน</li>
                    <li class="mb-2">นำ **Branch ID** (ตัวเลขต่อท้าย URL เช่น 71124) มาใส่ในช่อง Branch ID</li>
                    <li class="mb-2">ระบุ **เลขบัญชี / PromptPay** เพื่อแสดงให้ลูกค้าโอนเงินในหน้าร้าน</li>
                    <li class="mb-0 text-success fw-bold">เมื่อกรอก API Key แล้ว ระบบจะเช็คและยึดข้อมูลสลิปตาม API SlipOK โดยอัตโนมัติ 100%!</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    $("#btn_save_bank").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('slip_api_key', $("#slip_api_key").val());
        formData.append('slip_api_branch', $("#slip_api_branch").val());
        formData.append('fname', $("#fname").val());
        formData.append('lname', $("#lname").val());
        formData.append('bnum', $("#bnum").val());
        formData.append('tname', $("#tname").val());
        formData.append('promptpay_id', $("#promptpay_id").val());

        Swal.fire({
            title: 'กำลังบันทึก...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        $.ajax({
            type: 'POST',
            url: 'system/backend/slip_manage.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({
                icon: 'success',
                title: 'บันทึกข้อมูลสำเร็จ',
                text: res.message
            }).then(() => window.location.reload());
        }).fail(function (jqXHR) {
            let res = jqXHR.responseJSON;
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res ? res.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        });
    });
</script>