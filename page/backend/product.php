<div class="p-4 p-lg-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-boxes-stacked text-xdvz-primary me-2"></i>
                จัดการสินค้าหน้าร้าน</h3>
            <p class="text-muted small mb-0">จัดการรายการสินค้า ราคา รูปภาพ และประเภทการสุ่มรางวัล</p>
        </div>
        <button class="btn xdvz-btn-cyan shadow-sm px-4" id="open_insert">
            <i class="fa-solid fa-plus me-2"></i> เพิ่มสินค้าใหม่
        </button>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ภาพสินค้า</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ชื่อสินค้า</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ราคา</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ประเภท</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">เครื่องมือ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM box_product ORDER BY id DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <img src="<?php echo htmlspecialchars($row['img']); ?>" class="rounded-3 shadow-sm border"
                                width="60px" height="60px" style="object-fit: cover;">
                        </td>
                        <td class="py-3">
                            <span
                                class="text-dark fw-bold small d-block"><?php echo htmlspecialchars($row['name']); ?></span>
                            <span class="badge bg-light text-muted fw-normal"
                                style="font-size: 0.7rem;"><?php echo htmlspecialchars($row['c_type']); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <span class="text-main fw-bold">฿<?php echo number_format($row['price'], 2); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <?php if ($row['type'] == "1"): ?>
                                <span class="badge bg-success-soft text-success px-3 rounded-pill">ได้ของแน่นอน</span>
                            <?php else: ?>
                                <span class="badge bg-primary-soft text-primary px-3 rounded-pill">สุ่มรางวัล</span>
                            <?php endif; ?>
                        </td>
                        <td class="py-3 text-center">
                            <div class="d-flex justify-content-center gap-2">
                                <a href="?page=stock_manage&id=<?php echo $row["id"]; ?>"
                                    class="btn btn-dark btn-sm rounded-pill px-3 fw-bold">
                                    <i class="fa-solid fa-box me-1"></i> สต็อก
                                </a>
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                                    onclick="get_detail(<?php echo $row['id']; ?>)">
                                    <i class="fa-solid fa-edit me-1"></i> แก้ไข
                                </button>
                                <button class="btn btn-danger btn-sm rounded-pill px-3 fw-bold"
                                    onclick="del('<?php echo $row['id']; ?>','<?php echo htmlspecialchars($row['name']); ?>')">
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

<!-- Modal เพิ่มสินค้า -->
<div class="modal fade" id="product_insert" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">เพิ่มสินค้าใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ชื่อสินค้า</label>
                        <input type="text" id="p_name" class="form-control py-2">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ราคาสินค้า (บาท)</label>
                        <input type="number" id="p_price" class="form-control py-2">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ลิงค์รูปภาพ (URL)</label>
                    <input type="text" id="p_img" class="form-control py-2">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">รายละเอียดสินค้า</label>
                    <textarea id="p_des" rows="3" class="form-control"></textarea>
                </div>
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ประเภทการแจกรางวัล</label>
                        <select class="form-select py-2" id="p_type_product">
                            <option value="0">สุ่มรางวัล (Chance Based)</option>
                            <option value="1">ได้ของรางวัลแน่นอน (Direct Buy)</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">หมวดหมู่</label>
                        <select class="form-select py-2" id="p_type_category">
                            <?php
                            $getrow = dd_q("SELECT * FROM category ORDER BY c_id DESC");
                            while ($row = $getrow->fetch(PDO::FETCH_ASSOC)) {
                                echo '<option value="' . $row['c_name'] . '">' . $row['c_name'] . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-3 fw-bold rounded-3 shadow-sm"
                    id="insert_btn">บันทึกสินค้าใหม่ลงระบบ</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal แก้ไขสินค้า -->
<div class="modal fade" id="product_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">แก้ไขข้อมูลสินค้า</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <!-- Similar Fields to Insert -->
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ชื่อสินค้า</label>
                        <input type="text" id="name" class="form-control py-2">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ราคาสินค้า</label>
                        <input type="number" id="price" class="form-control py-2">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">ลิงค์รูปภาพ</label>
                    <input type="text" id="img" class="form-control py-2">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">รายละเอียด</label>
                    <textarea id="des" rows="3" class="form-control"></textarea>
                </div>
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">ประเภทการแจก</label>
                        <select class="form-select py-2" id="type_product">
                            <option value="0">สุ่มรางวัล</option>
                            <option value="1">ได้ของแน่นอน</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">หมวดหมู่</label>
                        <select class="form-select py-2" id="type_category">
                            <?php
                            $addgr = dd_q("SELECT * FROM category ORDER BY c_id DESC");
                            while ($row = $addgr->fetch(PDO::FETCH_ASSOC)) {
                                echo '<option value="' . $row['c_name'] . '">' . $row['c_name'] . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0 text-center justify-content-center">
                <button type="button" class="btn btn-dark w-100 py-3 fw-bold rounded-3 shadow-sm" id="save_btn"
                    data-id="">อัพเดทข้อมูลสินค้า</button>
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
        var formData = new FormData();
        formData.append('name', $("#p_name").val());
        formData.append('img', $("#p_img").val());
        formData.append('price', $("#p_price").val());
        formData.append('des', $("#p_des").val());
        formData.append('type', $("#p_type_product").val());
        formData.append('c_type', $("#p_type_category").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/product_insert.php',
            data: formData,
            contentType: false,
            processData: false,
        }).done(function (res) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
        });
    });

    $("#save_btn").click(function () {
        var formData = new FormData();
        formData.append('id', $("#save_btn").attr("data-id"));
        formData.append('name', $("#name").val());
        formData.append('img', $("#img").val());
        formData.append('price', $("#price").val());
        formData.append('des', $("#des").val());
        formData.append('type', $("#type_product").val());
        formData.append('c_type', $("#type_category").val());
        $.ajax({
            type: 'POST',
            url: 'system/backend/product_update.php',
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
            url: 'system/backend/call/product_detail.php',
            data: { id: id }
        }).done(function (res) {
            $("#name").val(res.name);
            $("#img").val(res.img);
            $("#price").val(res.price);
            $("#des").val(res.des);
            $("#type_product").val(res.type);
            $("#type_category").val(res.c_type);
            $("#save_btn").attr("data-id", id);
            new bootstrap.Modal('#product_detail').show();
        });
    }

    function del(id, name) {
        Swal.fire({
            title: 'ยืนยันที่จะลบ?',
            text: "คุณแน่ใจหรอที่จะลบ " + name,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: 'system/backend/product_del.php',
                    data: { id: id }
                }).done(function (res) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: res.message }).then(() => window.location.reload());
                });
            }
        });
    }
</script>