<?php
if (!isset($_GET["id"])) {
    // Show product selector if no id provided
    $all_products = dd_q("SELECT * FROM box_product ORDER BY id DESC");
    ?>
    <div class="p-4 p-lg-5">
        <div class="mb-5">
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-boxes-stacked text-xez-primary me-2"></i> จัดการสต็อกสินค้า</h3>
            <p class="text-muted small mb-0">เลือกสินค้าที่ต้องการจัดการสต็อก</p>
        </div>
        <div class="row g-4">
            <?php while ($p = $all_products->fetch(PDO::FETCH_ASSOC)): ?>
            <div class="col-md-4 col-lg-3">
                <a href="?page=stock_manage&id=<?= $p['id'] ?>" class="text-decoration-none">
                    <div class="xez-card p-3 text-center h-100 product-card">
                        <img src="<?= htmlspecialchars($p['img']) ?>" class="rounded-3 mb-3"
                            style="width:80px;height:80px;object-fit:cover;">
                        <div class="fw-bold text-dark small mb-1"><?= htmlspecialchars($p['name']) ?></div>
                        <div class="text-xez-primary fw-bold small mb-2">฿<?= number_format($p['price'], 2) ?></div>
                        <?php $cnt = dd_q("SELECT COUNT(*) as c FROM box_stock WHERE p_id = ?", [$p['id']])->fetch(PDO::FETCH_ASSOC)['c']; ?>
                        <span class="badge bg-secondary-soft text-secondary"><?= $cnt ?> ชิ้นในสต็อก</span>
                    </div>
                </a>
            </div>
            <?php endwhile; ?>
        </div>
    </div>
    <?php
} elseif (isset($_GET["id"])) {
    $find = dd_q("SELECT * FROM box_product WHERE id = ? ", [$_GET['id']]);
    $pd = $find->fetch(PDO::FETCH_ASSOC);
    if ($find->rowCount() >= 1) {
        ?>
        <div class="p-4 p-lg-5">
            <div class="d-flex justify-content-between align-items-sm-center flex-column flex-sm-row mb-5">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-box text-xdvz-primary me-2"></i> จัดการสต็อกสินค้า
                    </h3>
                    <p class="text-muted small mb-0">จัดการรายการของรางวัล/ไอเทม สำหรับสินค้า: <span
                            class="text-dark fw-bold"><?= htmlspecialchars($pd['name']) ?></span></p>
                </div>
                <div class="mt-3 mt-sm-0 gap-2 d-flex">
                    <button class="btn btn-outline-warning shadow-sm px-4 d-none" id="open_salt" style="border-radius: 12px;">
                        <i class="fa-solid fa-percent me-2"></i> ตั้งค่าเกลือ
                    </button>
                    <button class="btn btn-outline-danger shadow-sm px-4" id="clear_all_stock"
                        data-pid="<?php echo $pd['id']; ?>">
                        <i class="fa-solid fa-trash-can me-2"></i> ล้างสต็อกทั้งหมด
                    </button>
                    <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
                        <i class="fa-solid fa-plus me-2"></i> เพิ่มสต็อกใหม่
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table id="table" class="table table-hover border-0 w-100">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                            <th class="border-0 py-3 text-muted small fw-bold">ข้อมูลรางวัล / ไอเทม</th>
                            <th class="border-0 py-3 text-muted small fw-bold text-center">ประเภท</th>
                            <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $get_user = dd_q("SELECT * FROM box_stock WHERE p_id = ?  ORDER BY id DESC", [$_GET['id']]);
                        while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                            ?>
                            <tr class="align-middle border-bottom">
                                <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                                <td class="py-3">
                                    <span class="text-dark fw-medium small"><?php echo htmlspecialchars($row['username']); ?></span>
                                </td>
                                <td class="py-3 text-center">
                                    <span class="badge bg-light text-muted fw-normal px-3 rounded-pill">สต็อกคงเหลือ</span>
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

        <!-- Modal เพิ่มสต็อก -->
        <div class="modal fade" id="product_insert" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header bg-light border-0">
                        <h5 class="fw-bold text-dark mb-0">เพิ่มสต็อกสินค้า (Bulk Add)</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label small fw-bold d-block">ระบุข้อมูลรางวัล</label>
                            <small class="text-muted d-block mb-2">* 1 บรรทัด = 1 รางวัล</small>
                            <textarea id="stock_data" rows="8" class="form-control" placeholder="ใส่ข้อมูลที่นี่..."
                                onkeyup="count_stock()"></textarea>
                        </div>
                        <div class="p-3 bg-light-soft rounded-3 border d-flex justify-content-between align-items-center">
                            <span class="small fw-bold text-dark">จำนวนที่นับได้ :</span>
                            <span class="badge bg-xdvz-primary rounded-pill px-3" id="count_stock">0</span>
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="insert_btn"
                            data-id="<?php echo $pd["id"] ?>">เพิ่มสต็อกลงระบบ</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal แก้ไขสต็อก -->
        <div class="modal fade" id="product_detail" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header bg-light border-0">
                        <h5 class="fw-bold text-dark mb-0">แก้ไขข้อมูลรางวัล</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-0">
                            <label class="form-label small fw-bold">ข้อมูลรางวัล</label>
                            <input id="upt_stock_data" type="text" class="form-control py-2">
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-dark w-100 py-2 rounded-3" id="save_btn"
                            data-id="">บันทึกการแก้ไข</button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            $(document).ready(function () {
                $('#table').DataTable({ "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" } });
                if (<?php echo ($pd["type"] == "0" ? 'true' : 'false'); ?>) {
                    $("#open_salt").removeClass("d-none");
                }
            });

            function count_stock() {
                var lines = $("#stock_data").val().split("\n").filter(line => line.trim() !== "");
                $("#count_stock").html(lines.length);
            }

            $("#open_insert").click(() => { new bootstrap.Modal('#product_insert').show(); });

            $("#insert_btn").click(function () {
                var formData = new FormData();
                formData.append('id', $(this).attr("data-id"));
                formData.append('data', $("#stock_data").val());
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/stock_insert.php',
                    data: formData,
                    contentType: false,
                    processData: false,
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            });

            $("#save_btn").click(function () {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/stock_update.php',
                    data: { id: $(this).attr("data-id"), data: $("#upt_stock_data").val() }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            });

            function get_detail(id) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/call/stock_detail.php',
                    data: { id: id }
                }).done(function (res) {
                    $("#upt_stock_data").val(res.username);
                    $("#save_btn").attr('data-id', id);
                    new bootstrap.Modal('#product_detail').show();
                });
            }

            function del(id, name) {
                Swal.fire({
                    title: 'ลบรายการสต็อก?',
                    text: "ยืนยันการลบ: " + name,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'ใช่, ลบเลย'
                }).then((result) => {
                    if (result.isConfirmed) {
                        $.ajax({
                            type: 'POST',
                            url: 'system/backend/stock_del.php',
                            data: { id: id }
                        }).done(function (res) {
                            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                        });
                    }
                });
            }

            // Clear all stock function
            $("#clear_all_stock").click(function() {
                const pid = $(this).attr("data-pid");
                Swal.fire({
                    title: 'ล้างสต็อกทั้งหมด?',
                    text: "คุณแน่ใจหรือไม่ที่ต้องการลบสต็อกทั้งหมดของสินค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'ใช่, ล้างทั้งหมด',
                    cancelButtonText: 'ยกเลิก'
                }).then((result) => {
                    if (result.isConfirmed) {
                        Swal.fire({
                            title: 'ยืนยันอีกครั้ง',
                            text: "พิมพ์ 'CONFIRM' เพื่อยืนยันการลบ",
                            input: 'text',
                            inputPlaceholder: 'พิมพ์ CONFIRM',
                            showCancelButton: true,
                            confirmButtonColor: '#dc3545',
                            confirmButtonText: 'ลบเลย',
                            cancelButtonText: 'ยกเลิก',
                            inputValidator: (value) => {
                                if (value !== 'CONFIRM') {
                                    return 'กรุณาพิมพ์ CONFIRM เพื่อยืนยัน';
                                }
                            }
                        }).then((confirmResult) => {
                            if (confirmResult.isConfirmed) {
                                Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                $.ajax({
                                    type: 'POST',
                                    url: 'system/backend/stock_clear_all.php',
                                    data: { p_id: pid }
                                }).done(function(res) {
                                    if (res.status === 'success') {
                                        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                                    } else {
                                        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: res.message });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        </script>
        <?php
    }
}
?>