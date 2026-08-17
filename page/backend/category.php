<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-layer-group text-xdvz-primary me-2"></i>
                จัดการหมวดหมู่สินค้า</h3>
            <p class="text-muted small mb-0">สร้าง แก้ไข หรือลบหมวดหมู่เพื่อจัดระเบียบสินค้าของคุณ</p>
        </div>
        <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มหมวดหมู่ใหม่
        </button>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ภาพ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ชื่อหมวดหมู่</th>
                    <th class="border-0 py-3 text-muted small fw-bold">คำอธิบาย</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM category ORDER BY c_id DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['c_id']; ?></td>
                        <td class="py-3">
                            <img src="<?php echo htmlspecialchars($row['img']); ?>" class="rounded-3 shadow-sm border"
                                width="60px" height="60px" style="object-fit: cover;">
                        </td>
                        <td class="py-3">
                            <span class="text-dark fw-bold small"><?php echo htmlspecialchars($row['c_name']); ?></span>
                        </td>
                        <td class="py-3">
                            <span class="text-muted small"><?php echo htmlspecialchars($row['des']); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                    onclick="get_detail(<?php echo $row['c_id']; ?>)">
                                    <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                </button>
                                <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                    onclick="del('<?php echo $row['c_id']; ?>','<?php echo htmlspecialchars($row['c_name']); ?>')">
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

<!-- Modal เพิ่มหมวดหมู่ -->
<div class="modal fade" id="category_insert" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">เพิ่มหมวดหมู่ใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">ชื่อหมวดหมู่</label>
                    <input type="text" id="p_name" class="form-control py-2">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ระดับรูปภาพ (URL)</label>
                    <input type="text" id="p_img" class="form-control py-2">
                </div>
                <div class="mb-0">
                    <label class="form-label small fw-bold">คำอธิบาย</label>
                    <textarea id="p_des" rows="3" class="form-control"></textarea>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="insert_btn">บันทึกหมวดหมู่</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขหมวดหมู่ -->
<div class="modal fade" id="category_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">แก้ไขข้อมูลหมวดหมู่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">ชื่อหมวดหมู่</label>
                    <input type="text" id="name" class="form-control py-2">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ลิงค์รูปภาพ (URL)</label>
                    <input type="text" id="img" class="form-control py-2">
                </div>
                <div class="mb-0">
                    <label class="form-label small fw-bold">รายละเอียด</label>
                    <textarea id="des" rows="3" class="form-control"></textarea>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="save_btn">อัพเดทข้อมูล</button>
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

    $("#open_insert").click(() => { new bootstrap.Modal('#category_insert').show(); });

    $("#insert_btn").click(function () {
        var formData = new FormData();
        formData.append('img', $("#p_img").val());
        formData.append('c_name', $("#p_name").val());
        formData.append('des', $("#p_des").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/category_insert.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    $("#save_btn").click(function () {
        var formData = new FormData();
        formData.append('c_id', $("#save_btn").attr("data-id"));
        formData.append('c_name', $("#name").val());
        formData.append('des', $("#des").val());
        formData.append('img', $("#img").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/category_update.php',
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
            url: 'system/backend/call/category_detail.php',
            data: { c_id: id }
        }).done(function (res) {
            $("#name").val(res.c_name);
            $("#des").val(res.des);
            $("#img").val(res.img);
            $("#save_btn").attr("data-id", id);
            new bootstrap.Modal('#category_detail').show();
        });
    }

    function del(id, name) {
        Swal.fire({
            title: 'ยืนยันที่จะลบ?',
            text: "คุณแน่ใจหรอที่จะลบหมวดหมู่ " + name,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/category_del.php',
                    data: { c_id: id }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            }
        });
    }
</script>