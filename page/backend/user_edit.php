<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-users text-xdvz-primary me-2"></i> จัดการผู้ใช้งานระบบ
        </h3>
        <p class="text-muted small">ตรวจสอบข้อมูล แก้ไขยอดเงิน หรือจัดการสถานะสมาชิกของผู้ใช้</p>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ชื่อผู้ใช้งาน</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เงินคงเหลือ (Points)</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ยอดเติมทั้งหมด</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM users ORDER BY id DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <div class="d-flex align-items-center">
                                <div class="bg-light-soft rounded-circle d-flex align-items-center justify-content-center me-2"
                                    style="width: 32px; height: 32px;">
                                    <i class="fa-solid fa-user text-xdvz-primary" style="font-size: 0.8rem;"></i>
                                </div>
                                <span
                                    class="text-dark fw-medium small"><?php echo htmlspecialchars($row['username']); ?></span>
                            </div>
                        </td>
                        <td class="py-3 text-center">
                            <span class="text-main fw-bold">฿<?php echo number_format($row['point'], 2); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <span class="text-dark small fw-bold">฿<?php echo number_format($row['total'], 2); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                    onclick="get_detail(<?php echo $row['id']; ?>)">
                                    <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                </button>
                                <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                    onclick="del('<?php echo $row['id']; ?>','<?php echo htmlspecialchars($row['username']); ?>')">
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

<div class="modal fade" id="product_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">แก้ไขข้อมูลผู้ใช้งาน</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">ชื่อผู้ใช้งาน</label>
                    <input type="text" id="username" class="form-control py-2 bg-light border-0" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">รหัสผ่านใหม่</label>
                    <input type="text" id="password" class="form-control py-2" placeholder="ปล่อยว่างหากไม่เปลี่ยน">
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">เงินคงเหลือ</label>
                        <input type="number" id="points" class="form-control py-2">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">ยอดการเติม</label>
                        <input type="number" id="total" class="form-control py-2">
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3"
                    id="save_btn">บันทึกการเปลี่ยนแปลง</button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" }
        });
    });

    $("#save_btn").click(function () {
        var formData = new FormData();
        formData.append('id', $("#save_btn").attr("data-id"));
        formData.append('password', $("#password").val());
        formData.append('total', $("#total").val());
        formData.append('point', $("#points").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/user_setting.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    function get_detail(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/user_detail.php',
            data: { id: id }
        }).done(function (res) {
            $("#username").val(res.username);
            $("#points").val(res.points);
            $("#total").val(res.total);
            $("#save_btn").attr("data-id", id);
            new bootstrap.Modal('#product_detail').show();
        });
    }

    function del(id, username) {
        Swal.fire({
            title: 'ยืนยันที่จะลบ?',
            text: "คุณแน่ใจหรอที่จะลบผู้ใช้ " + username,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/user_del.php',
                    data: { id: id }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            }
        });
    }
</script>