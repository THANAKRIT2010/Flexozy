<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-ticket text-xdvz-primary me-2"></i>
                จัดการโค้ดส่วนลด/พ้อยท์</h3>
            <p class="text-muted small mb-0">สร้างโค้ดสำหรับแลกรับพ้อยท์ฟรี พร้อมระบบจำกัดจำนวนผู้ใช้งาน</p>
        </div>
        <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มโค้ดใหม่
        </button>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">รหัสโค้ด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">รางวัล (Points)</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ใช้งานแล้ว</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">จำกัดสูงสุด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM redeem ORDER BY id DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <code class="bg-light px-3 py-1 rounded text-xdvz-primary fw-bold"
                                style="font-size: 0.9rem;"><?php echo htmlspecialchars($row['code']); ?></code>
                        </td>
                        <td class="py-3 text-center text-main fw-bold">฿<?php echo number_format($row['prize'], 2); ?></td>
                        <td class="py-3 text-center">
                            <span
                                class="badge bg-light text-dark px-3 rounded-pill fw-normal"><?php echo number_format($row['count']); ?>
                                ครั้ง</span>
                        </td>
                        <td class="py-3 text-center">
                            <span
                                class="badge bg-primary-soft text-primary px-3 rounded-pill fw-bold"><?php echo number_format($row['max_count']); ?>
                                ครั้ง</span>
                        </td>
                        <td class="py-3 text-center">
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                    onclick="get_detail(<?php echo $row['id']; ?>)">
                                    <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                </button>
                                <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                    onclick="del('<?php echo $row['id']; ?>','<?php echo htmlspecialchars($row['code']); ?>')">
                                    <i class="fa-solid fa-trash me-1"></i> ลบ
                                </button>
                            </div>
                        </td>
                    </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal เพิ่มโค้ด -->
<div class="modal fade" id="product_insert" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">สร้างโค้ดใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสโค้ด (Redeem Code)</label>
                    <input type="text" id="code" class="form-control py-2" placeholder="เช่น NEWUSER2024">
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">รางวัล (พ้อยท์)</label>
                        <input type="number" id="reward" class="form-control py-2">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">จำกัดจำนวน (คน)</label>
                        <input type="number" id="count" class="form-control py-2">
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3"
                    id="insert_btn">บันทึกและเปิดใช้งานโค้ด</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขโค้ด -->
<div class="modal fade" id="product_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">แก้ไขข้อมูลโค้ด</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสโค้ด</label>
                    <input type="text" id="upt_code" class="form-control py-2">
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">รางวัล (พ้อยท์)</label>
                        <input type="number" id="upt_reward" class="form-control py-2">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">จำกัดจำนวน</label>
                        <input type="number" id="upt_count" class="form-control py-2">
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="save_btn"
                    data-id="">อัพเดทข้อมูล</button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#table').DataTable({ "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" } });
    });

    $("#open_insert").click(() => { new bootstrap.Modal('#product_insert').show(); });

    $("#insert_btn").click(function () {
        $.ajax({
            type: 'POST',
            url: 'system/backend/code_insert.php',
            data: { code: $("#code").val(), reward: $("#reward").val(), count: $("#count").val() }
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    $("#save_btn").click(function () {
        $.ajax({
            type: 'POST',
            url: 'system/backend/code_update.php',
            data: { id: $(this).attr("data-id"), reward: $("#upt_reward").val(), count: $("#upt_count").val(), code: $("#upt_code").val() }
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    function get_detail(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/code_detail.php',
            data: { id: id }
        }).done(function (res) {
            $("#upt_code").val(res.code);
            $("#upt_reward").val(res.reward);
            $("#upt_count").val(res.max_count);
            $("#save_btn").attr("data-id", id);
            new bootstrap.Modal('#product_detail').show();
        });
    }

    function del(id, code) {
        Swal.fire({
            title: 'ลบโค้ดนี้?',
            text: "ยืนยันการลบโค้ด: " + code,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/code_del.php',
                    data: { id: id }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            }
        });
    }
</script>