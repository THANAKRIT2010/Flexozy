<div class="container-sm py-5">
    <?php if (!isset($_GET['category'])): ?>
        <div class="text-center mb-5">
            <h3 class="fw-bold mb-2"><i class="fa-solid fa-layer-group text-xez-primary me-2"></i> หมวดหมู่สินค้าทั้งหมด
            </h3>
            <p class="text-muted">เลือกหมวดหมู่ที่คุณสนใจเพื่อดูสินค้า</p>
        </div>

        <div class="row g-4">
            <?php
            $cfind = dd_q("SELECT * FROM category ORDER BY RAND()");
            if ($cfind->rowCount() == 0) {
                echo '<div class="col-12 text-center"><p class="text-muted">ไม่มีหมวดหมู่ในตอนนี้</p></div>';
            }
            while ($row = $cfind->fetch(PDO::FETCH_ASSOC)):
                ?>
                <div class="col-12 col-md-6">
                    <a href="?page=shop&category=<?= htmlspecialchars($row['c_name']) ?>" class="text-decoration-none">
                        <div class="xez-card p-0 overflow-hidden position-relative" style="height: 200px;">
                            <img src="<?= htmlspecialchars($row['img']) ?>" class="w-100 h-100"
                                style="object-fit: cover; transition: transform 0.4s ease;">
                            <div class="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center"
                                style="background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);">
                                <div class="text-center text-white">
                                    <h4 class="fw-bold mb-1"><?= htmlspecialchars($row['c_name']) ?></h4>
                                    <p class="small mb-0 opacity-75"><?= htmlspecialchars($row['des']) ?></p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            <?php endwhile; ?>
        </div>
    <?php else: ?>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h4 class="fw-bold mb-1"><i class="fa-solid fa-box text-xez-primary me-2"></i>
                    <?= htmlspecialchars($_GET['category']) ?></h4>
                <p class="text-muted small mb-0">สินค้าในหมวดหมู่นี้</p>
            </div>
            <a href="?page=shop" class="btn xez-btn-outline btn-sm px-4">
                <i class="fa-solid fa-arrow-left me-1"></i> กลับ
            </a>
        </div>

        <div class="row g-4">
            <?php
            $cat_param = $_GET['category'];
            $cat_name = $cat_param; // Default to assuming it's a name
        
            // If it's a numeric ID, look up the name first
            if (is_numeric($cat_param)) {
                $c_row = dd_q("SELECT c_name FROM category WHERE c_id = ?", [$cat_param])->fetch(PDO::FETCH_ASSOC);
                if ($c_row) {
                    $cat_name = $c_row['c_name'];
                }
            }

            // Query using the name (since box_product stores name in c_type)
            $find = dd_q("SELECT * FROM box_product WHERE c_type = ? ORDER BY id DESC", [$cat_name]);
            if ($find->rowCount() == 0) {
                echo '<div class="col-12 text-center py-5"><p class="text-muted">ไม่พบสินค้าในหมวดหมู่นี้</p></div>';
            }
            while ($row = $find->fetch(PDO::FETCH_ASSOC)):
                $stock = dd_q("SELECT * FROM box_stock WHERE p_id = ?", [$row["id"]])->rowCount();
                ?>
                <div class="col-6 col-md-4 col-lg-3">
                    <a href="?page=product&id=<?= $row['id'] ?>" class="text-decoration-none">
                        <div class="xez-card h-100 p-3 text-center position-relative product-card">
                            <?php if ($row['price'] < 100): ?>
                                <span class="badge bg-danger position-absolute"
                                    style="top: 15px; right: 15px; z-index: 5;">HOT</span>
                            <?php endif; ?>

                            <div class="mb-3 overflow-hidden rounded" style="aspect-ratio: 1/1;">
                                <img src="<?= htmlspecialchars($row['img']) ?>" class="w-100 h-100"
                                    style="object-fit: cover; transition: transform 0.3s ease;">
                            </div>

                            <h6 class="fw-bold mb-2 text-truncate"><?= htmlspecialchars($row['name']) ?></h6>

                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-xez-primary fw-bold"><?= number_format($row['price']) ?> ฿</span>
                                <span class="text-muted small"><?= $stock ?> ชิ้น</span>
                            </div>

                            <span class="btn xez-btn-cyan w-100">
                                <i class="fa-solid fa-eye me-1"></i> ดูรายละเอียด
                            </span>
                        </div>
                    </a>
                </div>
            <?php endwhile; ?>
        </div>
    <?php endif; ?>
</div>

<!-- Product Detail Modal -->
<div class="modal fade" id="product_detail" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold"><i class="fa-solid fa-box me-2 text-xez-primary"></i> รายละเอียดสินค้า
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="text-center mb-4">
                    <img src="" id="p_img" class="img-fluid rounded" style="max-height: 250px;">
                </div>
                <h5 id="p_name" class="fw-bold text-center mb-3">N/A</h5>
                <div class="bg-light-soft p-3 rounded">
                    <p class="small fw-bold text-muted mb-2"><i class="fa-solid fa-file-lines me-1"></i> รายละเอียด</p>
                    <p id="p_des" class="mb-0" style="white-space: pre-wrap;">N/A</p>
                </div>
                <div class="alert alert-warning mt-3 mb-0 small">
                    <i class="fa-solid fa-exclamation-triangle me-1"></i>
                    <strong>คำเตือน:</strong> โปรดอัดวีดิโอก่อนซื้อเพื่อเป็นหลักฐาน
                    หากไม่มีหลักฐานทางร้านขอสงวนสิทธิ์ไม่รับผิดชอบ
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
            </div>
        </div>
    </div>
</div>

<script>
    function detail(id) {
        $.ajax({
            type: 'POST',
            url: 'system/backend/call/product_detail.php',
            data: { id: id }
        }).done(function (res) {
            $("#p_img").attr("src", res.img);
            $("#p_name").text(res.name);
            $("#p_des").text(res.des);
            new bootstrap.Modal('#product_detail').show();
        });
    }
</script>