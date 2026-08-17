<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-fire text-xdvz-primary me-2"></i> จัดการสินค้าแนะนำ
        </h3>
        <p class="text-muted small">เลือกสินค้าที่คุณต้องการให้แสดงในส่วน "สินค้าแนะนำ" บนหน้าแรก (สูงสุด 10 รายการ)</p>
    </div>

    <div class="row g-4">
        <div class="col-lg-8">
            <div class="row g-3">
                <?php
                $find = dd_q("SELECT * FROM recom ");
                $data = $find->fetch(PDO::FETCH_ASSOC);

                for ($i = 1; $i <= 10; $i++):
                    $current_val = $data['recom_' . $i];
                    ?>
                    <div class="col-md-6 mb-3">
                        <div class="p-3 bg-light-soft rounded-4 border">
                            <label class="form-label small fw-bold text-dark d-flex align-items-center mb-2">
                                <span
                                    class="badge bg-xdvz-primary me-2 rounded-circle d-flex align-items-center justify-content-center"
                                    style="width: 20px; height: 20px; font-size: 0.7rem;"><?= $i ?></span>
                                สินค้าแนะนำลำดับที่ <?= $i ?>
                            </label>
                            <select class="form-select border-0 shadow-sm py-2" id="pop_<?= $i ?>">
                                <?php if ($current_val == "0"): ?>
                                    <option value="0" selected>-- โปรดเลือกสินค้า --</option>
                                <?php else:
                                    $get_p = dd_q("SELECT name FROM box_product WHERE id = ?", [$current_val]);
                                    $p_name = $get_p->fetch(PDO::FETCH_ASSOC)['name'];
                                    ?>
                                    <option value="<?= $current_val ?>" selected><?= htmlspecialchars($p_name) ?></option>
                                    <option value="0">-- ไม่แสดง --</option>
                                <?php endif; ?>

                                <?php
                                $all_p = dd_q("SELECT id, name FROM box_product ORDER BY id DESC");
                                while ($row = $all_p->fetch(PDO::FETCH_ASSOC)) {
                                    if ($row['id'] == $current_val)
                                        continue;
                                    echo '<option value="' . $row['id'] . '">' . htmlspecialchars($row['name']) . '</option>';
                                }
                                ?>
                            </select>
                        </div>
                    </div>
                <?php endfor; ?>
            </div>

            <div class="mt-4">
                <button class="btn xdvz-btn-cyan w-100 py-3 fw-bold shadow-sm" id="btn_regis">
                    <i class="fa-solid fa-save me-2"></i> บันทึกการตั้งค่าทั้งหมด
                </button>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="sticky-top" style="top: 2rem;">
                <div class="p-4 bg-light rounded-4 border">
                    <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-circle-info me-2 text-xdvz-primary"></i>
                        คำแนะนำ</h6>
                    <ul class="text-muted small ps-3 mb-0">
                        <li class="mb-2">สินค้าแนะนำจะปรากฏที่หน้าแรกของเว็บไซต์</li>
                        <li class="mb-2">หากต้องการยกเลิกการแนะะนำ ให้ปรับเป็น **"-- ไม่แสดง --"**</li>
                        <li class="mb-2">คุณสามารถจัดลำดับความสำคัญได้โดยเรียงตาม 1 ถึง 10</li>
                        <li class="mb-0">การตั้งค่าจะมีผลทันทีหลังจากกดบันทึก</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    $("#btn_regis").click(function (e) {
        e.preventDefault();
        var formData = new FormData();
        for (let i = 1; i <= 10; i++) {
            formData.append('pop_' + i, $("#pop_" + i).val());
        }

        Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => { Swal.showLoading() } });

        $.ajax({
            type: 'POST',
            url: 'system/backend/recom_update.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });
</script>