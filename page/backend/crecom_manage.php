<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-list-check text-xdvz-primary me-2"></i>
            จัดการหมวดหมู่แนะนำ</h3>
        <p class="text-muted small">เลือกหมวดหมู่สินค้าที่คุณต้องการให้แสดงเป็นอันดับแรกๆ ในหน้าเลือกสินค้า</p>
    </div>

    <div class="row g-4">
        <div class="col-lg-6">
            <div class="mb-4 p-4 bg-light-soft rounded-4 border">
                <label class="form-label small fw-bold text-dark mb-2">หมวดหมู่แนะนำลำดับที่ 1</label>
                <select class="form-select border-0 shadow-sm py-2" id="pop_1">
                    <?php
                    $find = dd_q("SELECT * FROM crecom ");
                    $data = $find->fetch(PDO::FETCH_ASSOC);
                    if ($data['recom_1'] != "0") {
                        $get_pd = dd_q("SELECT * FROM category WHERE c_id = ? ", [$data['recom_1']]);
                        $data_pd = $get_pd->fetch(PDO::FETCH_ASSOC);
                        echo '<option value="' . $data['recom_1'] . '" selected>' . htmlspecialchars($data_pd['c_name']) . '</option>';
                        echo '<option value="0">-- ไม่ระบุ --</option>';
                    } else {
                        echo '<option value="0" selected>-- โปรดเลือกหมวดหมู่ --</option>';
                    }
                    $all_p = dd_q("SELECT * FROM category ORDER BY c_id DESC");
                    while ($row = $all_p->fetch(PDO::FETCH_ASSOC)) {
                        if ($row['c_id'] == $data['recom_1'])
                            continue;
                        echo '<option value="' . $row['c_id'] . '">' . htmlspecialchars($row['c_name']) . '</option>';
                    }
                    ?>
                </select>
            </div>

            <div class="mb-5 p-4 bg-light-soft rounded-4 border">
                <label class="form-label small fw-bold text-dark mb-2">หมวดหมู่แนะนำลำดับที่ 2</label>
                <select class="form-select border-0 shadow-sm py-2" id="pop_2">
                    <?php
                    if ($data['recom_2'] != "0") {
                        $get_pd = dd_q("SELECT * FROM category WHERE c_id = ? ", [$data['recom_2']]);
                        $data_pd = $get_pd->fetch(PDO::FETCH_ASSOC);
                        echo '<option value="' . $data['recom_2'] . '" selected>' . htmlspecialchars($data_pd['c_name']) . '</option>';
                        echo '<option value="0">-- ไม่ระบุ --</option>';
                    } else {
                        echo '<option value="0" selected>-- โปรดเลือกหมวดหมู่ --</option>';
                    }
                    $all_p = dd_q("SELECT * FROM category ORDER BY c_id DESC");
                    while ($row = $all_p->fetch(PDO::FETCH_ASSOC)) {
                        if ($row['c_id'] == $data['recom_2'])
                            continue;
                        echo '<option value="' . $row['c_id'] . '">' . htmlspecialchars($row['c_name']) . '</option>';
                    }
                    ?>
                </select>
            </div>

            <button class="btn xdvz-btn-cyan w-100 py-3 fw-bold shadow-sm" id="btn_regis">
                <i class="fa-solid fa-save me-2"></i> บันทึกข้อมูล
            </button>
        </div>

        <div class="col-lg-6">
            <div class="p-4 bg-light rounded-4 border">
                <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-circle-info me-2 text-xdvz-primary"></i>
                    เกี่ยวกับหมวดหมู่แนะนำ</h6>
                <p class="text-muted small mb-3">
                    การตั้งค่านี้จะช่วยให้ลูกค้าสามารถเข้าถึงหมวดหมู่สินค้าหลักของคุณได้รวดเร็วยิ่งขึ้น
                    โดยจะแสดงเป็นบัตรขนาดใหญ่หรือด้านบนสุดของรายการหมวดหมู่
                </p>
                <div class="p-3 bg-white rounded-3 border-0 small text-muted italic">
                    * ระบบรองรับการตั้งค่าสูงสุด 2 หมวดหมู่หลัก
                </div>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    $("#btn_regis").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append('pop_1', $("#pop_1").val());
        formData.append('pop_2', $("#pop_2").val());

        Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => { Swal.showLoading() } });

        $.ajax({
            type: 'POST',
            url: 'system/backend/crecom_update.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });
</script>