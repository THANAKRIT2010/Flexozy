<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-bullhorn text-xez-primary me-2"></i>
                จัดการป๊อปอัพประกาศ</h3>
            <p class="text-muted small mb-0">ประกาศที่จะแสดงเป็นป๊อปอัพตอนเข้าเว็บ</p>
        </div>
        <button class="btn xez-btn-cyan shadow-sm px-4" id="open_popup_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มประกาศใหม่
        </button>
    </div>

    <div class="table-responsive">
        <table id="popup_table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">หัวข้อ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">เนื้อหา</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">สถานะ</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_popups = dd_q("SELECT * FROM popup_announcements ORDER BY show_order ASC, id DESC");
                if ($get_popups && $get_popups->rowCount() > 0):
                    while ($row = $get_popups->fetch(PDO::FETCH_ASSOC)):
                        $is_active = $row['is_active'] == 1;
                        ?>
                        <tr class="align-middle border-bottom">
                            <td class="py-3 ps-4 text-dark small fw-bold">#
                                <?= $row['id'] ?>
                            </td>
                            <td class="py-3">
                                <strong>
                                    <?= htmlspecialchars($row['title']) ?>
                                </strong>
                            </td>
                            <td class="py-3">
                                <span class="text-muted small">
                                    <?= mb_substr(htmlspecialchars($row['content']), 0, 50) ?>...
                                </span>
                            </td>
                            <td class="py-3 text-center">
                                <?php if ($is_active): ?>
                                    <span class="badge bg-success px-3 rounded-pill">เปิด</span>
                                <?php else: ?>
                                    <span class="badge bg-danger px-3 rounded-pill">ปิด</span>
                                <?php endif; ?>
                            </td>
                            <td class="py-3 text-center">
                                <div class="d-flex justify-content-center gap-2">
                                    <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                        onclick="editPopup(<?= $row['id'] ?>)">
                                        <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                    </button>
                                    <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                        onclick="deletePopup(<?= $row['id'] ?>, '<?= htmlspecialchars(addslashes($row['title'])) ?>')">
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
                        <td colspan="5" class="text-center py-5 text-muted">
                            <i class="fa-solid fa-bullhorn fa-3x mb-3 opacity-50"></i>
                            <p>ยังไม่มีประกาศ</p>
                            <p class="small">กดปุ่ม "เพิ่มประกาศใหม่" เพื่อสร้างประกาศ</p>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal เพิ่มประกาศ -->
<div class="modal fade" id="popup_insert_modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0"><i
                        class="fa-solid fa-plus-circle text-xez-primary me-2"></i>เพิ่มประกาศใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-3">
                    <label class="form-label small fw-bold">หัวข้อประกาศ</label>
                    <input type="text" id="new_title" class="form-control py-2" placeholder="เช่น ยินดีต้อนรับ">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">เนื้อหาประกาศ</label>
                    <textarea id="new_content" class="form-control" rows="4"
                        placeholder="เนื้อหาที่ต้องการประกาศ..."></textarea>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">รูปภาพ (URL)</label>
                        <input type="text" id="new_image" class="form-control py-2" placeholder="ไม่บังคับ">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">ข้อความปุ่ม</label>
                        <input type="text" id="new_button" class="form-control py-2" value="ถัดไป">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ลิงก์ปุ่ม (URL)</label>
                    <input type="text" id="new_link" class="form-control py-2" placeholder="ไม่บังคับ">
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="new_active" checked>
                    <label class="form-check-label small" for="new_active">เปิดใช้งานทันที</label>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="save_new_popup">
                    <i class="fa-solid fa-save me-2"></i>บันทึกประกาศ
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขประกาศ -->
<div class="modal fade" id="popup_edit_modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0"><i class="fa-solid fa-edit text-warning me-2"></i>แก้ไขประกาศ</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <input type="hidden" id="edit_id">
                <div class="mb-3">
                    <label class="form-label small fw-bold">หัวข้อประกาศ</label>
                    <input type="text" id="edit_title" class="form-control py-2">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">เนื้อหาประกาศ</label>
                    <textarea id="edit_content" class="form-control" rows="4"></textarea>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold">รูปภาพ (URL)</label>
                        <input type="text" id="edit_image" class="form-control py-2">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold">ข้อความปุ่ม</label>
                        <input type="text" id="edit_button" class="form-control py-2">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ลิงก์ปุ่ม (URL)</label>
                    <input type="text" id="edit_link" class="form-control py-2">
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="edit_active">
                    <label class="form-check-label small" for="edit_active">เปิดใช้งาน</label>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-warning w-100 py-2 rounded-3" id="update_popup">
                    <i class="fa-solid fa-save me-2"></i>อัพเดทประกาศ
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#popup_table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" }
        });
    });

    $("#open_popup_insert").click(() => {
        new bootstrap.Modal('#popup_insert_modal').show();
    });

    // Save new popup
    $("#save_new_popup").click(function () {
        const data = {
            title: $("#new_title").val(),
            content: $("#new_content").val(),
            image: $("#new_image").val(),
            button_text: $("#new_button").val(),
            button_link: $("#new_link").val(),
            active: $("#new_active").is(':checked') ? 1 : 0
        };

        if (!data.title) {
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'กรุณากรอกหัวข้อประกาศ' });
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'system/backend/popup_insert.php',
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

    // Edit popup
    function editPopup(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/popup_detail.php',
            data: { id: id },
            dataType: 'json'
        }).done(function (res) {
            $("#edit_id").val(res.id);
            $("#edit_title").val(res.title);
            $("#edit_content").val(res.content);
            $("#edit_image").val(res.image_url);
            $("#edit_button").val(res.button_text);
            $("#edit_link").val(res.button_link);
            $("#edit_active").prop('checked', res.is_active == 1);
            new bootstrap.Modal('#popup_edit_modal').show();
        });
    }

    // Update popup
    $("#update_popup").click(function () {
        const data = {
            id: $("#edit_id").val(),
            title: $("#edit_title").val(),
            content: $("#edit_content").val(),
            image: $("#edit_image").val(),
            button_text: $("#edit_button").val(),
            button_link: $("#edit_link").val(),
            active: $("#edit_active").is(':checked') ? 1 : 0
        };

        $.ajax({
            type: 'POST',
            url: 'system/backend/popup_update.php',
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

    // Delete popup
    function deletePopup(id, title) {
        Swal.fire({
            title: 'ลบประกาศ?',
            text: 'ยืนยันลบประกาศ: ' + title,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/popup_delete.php',
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