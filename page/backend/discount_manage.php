<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-percent text-xez-primary me-2"></i>
                โค้ดส่วนลดสินค้า</h3>
            <p class="text-muted small mb-0">สร้างโค้ดส่วนลดสำหรับลูกค้าใช้ตอนซื้อสินค้า</p>
        </div>
        <button class="btn xez-btn-cyan shadow-sm px-4" id="open_discount_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มโค้ดส่วนลด
        </button>
    </div>

    <div class="table-responsive">
        <table id="discount_table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">โค้ด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ส่วนลด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ใช้แล้ว/จำกัด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">สถานะ</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_codes = dd_q("SELECT * FROM discount_codes ORDER BY id DESC");
                if ($get_codes && $get_codes->rowCount() > 0):
                    while ($row = $get_codes->fetch(PDO::FETCH_ASSOC)):
                        $discount_display = $row['discount_type'] == 'percent'
                            ? number_format($row['discount_value']) . '%'
                            : '฿' . number_format($row['discount_value']);
                        $usage_display = $row['usage_limit']
                            ? $row['used_count'] . '/' . $row['usage_limit']
                            : $row['used_count'] . '/∞';
                        $is_active = $row['is_active'] == 1;
                        ?>
                        <tr class="align-middle border-bottom">
                            <td class="py-3 ps-4 text-dark small fw-bold">#
                                <?= $row['id'] ?>
                            </td>
                            <td class="py-3">
                                <code
                                    class="bg-light px-3 py-1 rounded text-xez-primary fw-bold"><?= htmlspecialchars($row['code']) ?></code>
                            </td>
                            <td class="py-3 text-center">
                                <span class="badge bg-success px-3 rounded-pill fw-bold">
                                    <?= $discount_display ?>
                                </span>
                            </td>
                            <td class="py-3 text-center">
                                <span class="badge bg-light text-dark px-3 rounded-pill">
                                    <?= $usage_display ?>
                                </span>
                            </td>
                            <td class="py-3 text-center">
                                <?php if ($is_active): ?>
                                    <span class="badge bg-success px-3 rounded-pill">เปิดใช้งาน</span>
                                <?php else: ?>
                                    <span class="badge bg-danger px-3 rounded-pill">ปิด</span>
                                <?php endif; ?>
                            </td>
                            <td class="py-3 text-center">
                                <div class="d-flex justify-content-center gap-2">
                                    <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                        onclick="editDiscount(<?= $row['id'] ?>)">
                                        <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                    </button>
                                    <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                        onclick="deleteDiscount(<?= $row['id'] ?>, '<?= htmlspecialchars($row['code']) ?>')">
                                        <i class="fa-solid fa-trash me-1"></i> ลบ
                                    </button>
                                </div>
                            </td>
                        </tr>
                    <?php
                    endwhile;
                else:
                    ?>
                    <tr>
                        <td colspan="6" class="text-center py-5 text-muted">
                            <i class="fa-solid fa-ticket fa-3x mb-3 opacity-50"></i>
                            <p>ยังไม่มีโค้ดส่วนลด</p>
                            <p class="small">กดปุ่ม "เพิ่มโค้ดส่วนลด" เพื่อสร้างโค้ดใหม่</p>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal เพิ่มโค้ดส่วนลด -->
<div class="modal fade" id="discount_insert_modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0"><i
                        class="fa-solid fa-plus-circle text-xez-primary me-2"></i>สร้างโค้ดส่วนลดใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสโค้ด</label>
                    <input type="text" id="new_code" class="form-control py-2" placeholder="เช่น SAVE20">
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">ประเภทส่วนลด</label>
                        <select id="new_type" class="form-select py-2">
                            <option value="percent">เปอร์เซ็นต์ (%)</option>
                            <option value="fixed">จำนวนเงิน (฿)</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">มูลค่าส่วนลด</label>
                        <input type="number" id="new_value" class="form-control py-2" placeholder="10">
                    </div>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">ยอดขั้นต่ำ (฿)</label>
                        <input type="number" id="new_min" class="form-control py-2" value="0">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">จำกัดใช้งาน (ครั้ง)</label>
                        <input type="number" id="new_limit" class="form-control py-2" placeholder="ไม่จำกัด">
                    </div>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="new_active" checked>
                    <label class="form-check-label small" for="new_active">เปิดใช้งานทันที</label>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="save_new_discount">
                    <i class="fa-solid fa-save me-2"></i>บันทึกโค้ดส่วนลด
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขโค้ดส่วนลด -->
<div class="modal fade" id="discount_edit_modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0"><i class="fa-solid fa-edit text-warning me-2"></i>แก้ไขโค้ดส่วนลด
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <input type="hidden" id="edit_id">
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสโค้ด</label>
                    <input type="text" id="edit_code" class="form-control py-2">
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">ประเภทส่วนลด</label>
                        <select id="edit_type" class="form-select py-2">
                            <option value="percent">เปอร์เซ็นต์ (%)</option>
                            <option value="fixed">จำนวนเงิน (฿)</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">มูลค่าส่วนลด</label>
                        <input type="number" id="edit_value" class="form-control py-2">
                    </div>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">ยอดขั้นต่ำ (฿)</label>
                        <input type="number" id="edit_min" class="form-control py-2">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">จำกัดใช้งาน</label>
                        <input type="number" id="edit_limit" class="form-control py-2">
                    </div>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit_active">
                    <label class="form-check-label small" for="edit_active">เปิดใช้งาน</label>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-warning w-100 py-2 rounded-3" id="update_discount">
                    <i class="fa-solid fa-save me-2"></i>อัพเดทโค้ด
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#discount_table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" }
        });
    });

    $("#open_discount_insert").click(() => {
        new bootstrap.Modal('#discount_insert_modal').show();
    });

    // Save new discount code
    $("#save_new_discount").click(function () {
        const data = {
            code: $("#new_code").val(),
            type: $("#new_type").val(),
            value: $("#new_value").val(),
            min: $("#new_min").val(),
            limit: $("#new_limit").val(),
            active: $("#new_active").is(':checked') ? 1 : 0
        };

        if (!data.code || !data.value) {
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'กรุณากรอกรหัสโค้ดและมูลค่าส่วนลด' });
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'system/backend/discount_insert.php',
            data: data,
            dataType: 'json'
        }).done(function (res) {
            if (res.status === 'success') {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
            } else {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res.message });
            }
        });
    });

    // Edit discount
    function editDiscount(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/discount_detail.php',
            data: { id: id },
            dataType: 'json'
        }).done(function (res) {
            $("#edit_id").val(res.id);
            $("#edit_code").val(res.code);
            $("#edit_type").val(res.discount_type);
            $("#edit_value").val(res.discount_value);
            $("#edit_min").val(res.min_purchase);
            $("#edit_limit").val(res.usage_limit);
            $("#edit_active").prop('checked', res.is_active == 1);
            new bootstrap.Modal('#discount_edit_modal').show();
        });
    }

    // Update discount
    $("#update_discount").click(function () {
        const data = {
            id: $("#edit_id").val(),
            code: $("#edit_code").val(),
            type: $("#edit_type").val(),
            value: $("#edit_value").val(),
            min: $("#edit_min").val(),
            limit: $("#edit_limit").val(),
            active: $("#edit_active").is(':checked') ? 1 : 0
        };

        $.ajax({
            type: 'POST',
            url: 'system/backend/discount_update.php',
            data: data,
            dataType: 'json'
        }).done(function (res) {
            if (res.status === 'success') {
                Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
            } else {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: res.message });
            }
        });
    });

    // Delete discount
    function deleteDiscount(id, code) {
        Swal.fire({
            title: 'ลบโค้ดส่วนลด?',
            text: 'ยืนยันลบโค้ด: ' + code,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/discount_delete.php',
                    data: { id: id },
                    dataType: 'json'
                }).done(function (res) {
                    if (res.status === 'success') {
                        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                    }
                });
            }
        });
    }
</script>
