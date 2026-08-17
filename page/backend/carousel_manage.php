<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-images text-xdvz-primary me-2"></i> จัดการภาพสไลด์
                (Carousel)</h3>
            <p class="text-muted small mb-0">จัดการภาพแบนเนอร์ที่จะแสดงบนหน้าแรกของเว็บไซต์</p>
        </div>
        <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มภาพใหม่
        </button>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ตัวอย่างรูปภาพ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ลิงค์รูปภาพ (URL)</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM carousel ORDER BY id DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <img src="<?php echo htmlspecialchars($row['link']); ?>" class="rounded-3 shadow-sm border"
                                width="160px" style="height: 80px; object-fit: cover;">
                        </td>
                        <td class="py-3">
                            <span class="text-muted small d-inline-block text-truncate" style="max-width: 300px;">
                                <?php echo htmlspecialchars($row['link']); ?>
                            </span>
                        </td>
                        <td class="py-3 text-center">
                            <div class="d-flex justify-content-center gap-2">
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                    onclick="get_detail(<?php echo $row['id']; ?>)">
                                    <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                </button>
                                <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                    onclick="del('<?php echo $row['id']; ?>','ภาพที่ #<?php echo $row['id']; ?>')">
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

<!-- Modal เพิ่มภาพ -->
<div class="modal fade" id="product_insert" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">เพิ่มภาพสไลด์ใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-0">
                    <label class="form-label small fw-bold">ลิงค์รูปภาพ (URL)</label>
                    <input type="text" id="link" class="form-control py-2" placeholder="https://example.com/banner.jpg">
                    <div class="form-text small mt-2">แนะนำขนาด 1920x600 หรือสัดส่วนที่เหมาะสม</div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="insert_btn">บันทึกภาพสไลด์</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขภาพ -->
<div class="modal fade" id="product_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">แก้ไขลิงค์รูปภาพ</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="mb-0">
                    <label class="form-label small fw-bold">ลิงค์รูปภาพใหม่</label>
                    <input type="text" id="upt_link" class="form-control py-2">
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
            url: 'system/backend/carousel_insert.php',
            data: { link: $("#link").val() }
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    $("#save_btn").click(function () {
        $.ajax({
            type: 'POST',
            url: 'system/backend/carousel_update.php',
            data: { id: $(this).attr("data-id"), link: $("#upt_link").val() }
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    function get_detail(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/carousel_detail.php',
            data: { id: id }
        }).done(function (res) {
            $("#upt_link").val(res.link);
            $("#save_btn").attr("data-id", id);
            new bootstrap.Modal('#product_detail').show();
        });
    }

    function del(id, name) {
        Swal.fire({
            title: 'ลบภาพสไลด์?',
            text: "คุณแน่ใจหรอที่จะลบ " + name,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/carousel_del.php',
                    data: { id: id }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            }
        });
    }
</script>