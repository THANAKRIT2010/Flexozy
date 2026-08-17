<?php
// Product Detail Page
if (!isset($_GET['id'])) {
    echo "<script>window.location.href = '?page=shop';</script>";
    exit;
}

$product_id = intval($_GET['id']);

// Get product - simpler query first
$product_result = dd_q("SELECT * FROM box_product WHERE id = ?", [$product_id]);

if (!$product_result || $product_result->rowCount() == 0) {
    echo "<script>alert('ไม่พบสินค้านี้'); window.location.href = '?page=shop';</script>";
    exit;
}

$product = $product_result->fetch(PDO::FETCH_ASSOC);

// Get category name separately
$category_name = '';
if (!empty($product['c_id'])) {
    $cat_result = dd_q("SELECT * FROM category WHERE id = ?", [$product['c_id']]);
    if ($cat_result && $cat_result->rowCount() > 0) {
        $cat = $cat_result->fetch(PDO::FETCH_ASSOC);
        $category_name = $cat['c_name'] ?? $cat['name'] ?? '';
    }
}

// Get stock count
$stock_result = dd_q("SELECT COUNT(*) as cnt FROM box_stock WHERE p_id = ?", [$product_id]);
$stock = $stock_result ? $stock_result->fetch(PDO::FETCH_ASSOC)['cnt'] : 0;
?>

<!-- Breadcrumb -->
<div class="container-sm py-3">
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0 small">
            <li class="breadcrumb-item"><a href="?page=shop" class="text-decoration-none">สินค้าทั้งหมด</a></li>
            <?php if (!empty($category_name)): ?>
                <li class="breadcrumb-item"><a href="?page=shop&category=<?= urlencode($product['c_type'] ?? '') ?>"
                        class="text-decoration-none">
                        <?= htmlspecialchars($category_name) ?>
                    </a></li>
            <?php endif; ?>
            <li class="breadcrumb-item active" aria-current="page">
                <?= htmlspecialchars($product['name']) ?>
            </li>
        </ol>
    </nav>
</div>

<!-- Product Detail Section -->
<div class="container-sm pb-5">
    <div class="product-detail-card">
        <div class="row g-4">
            <!-- Product Image -->
            <div class="col-lg-5">
                <div class="product-image-wrapper">
                    <img src="<?= htmlspecialchars($product['img'] ?? '') ?>"
                        alt="<?= htmlspecialchars($product['name']) ?>" class="product-main-image">
                    <?php if ($stock <= 5 && $stock > 0): ?>
                        <span class="product-badge badge-warning">เหลือน้อย</span>
                    <?php elseif ($stock == 0): ?>
                        <span class="product-badge badge-danger">สินค้าหมด</span>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Product Info -->
            <div class="col-lg-7">
                <div class="product-info">
                    <h1 class="product-title">
                        <?= htmlspecialchars($product['name']) ?>
                    </h1>

                    <div class="product-description">
                        <h6 class="fw-bold mb-3">รายละเอียดสินค้า</h6>
                        <div class="description-content">
                            <?= nl2br(htmlspecialchars($product['des'] ?? 'ไม่มีรายละเอียด')) ?>
                        </div>
                    </div>

                    <div class="product-price-box">
                        <span class="product-price">
                            <?= number_format($product['price']) ?> ฿
                        </span>
                        <?php if ($product['price'] < 100): ?>
                            <span class="badge bg-danger ms-2">HOT DEAL</span>
                        <?php endif; ?>
                    </div>

                    <div class="product-stock-info">
                        <span class="text-muted">สินค้าคงเหลือ
                            <?= $stock ?> ชิ้น
                        </span>
                        <span class="mx-2">|</span>
                        <span class="text-muted">ราคาสินค้า
                            <?= number_format($product['price']) ?> บาท / ชิ้น
                        </span>
                    </div>

                    <?php if ($stock > 0): ?>
                        <div class="product-quantity">
                            <button type="button" class="qty-btn" onclick="changeQty(-1)">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <input type="number" id="qty-input" value="1" min="1" max="<?= $stock ?>" class="qty-input"
                                readonly>
                            <button type="button" class="qty-btn" onclick="changeQty(1)">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>

                        <!-- Discount Code Input -->
                        <div class="discount-code-box mb-3">
                            <label class="form-label small fw-bold">
                                <i class="fa-solid fa-tag text-xez-primary me-1"></i> โค้ดส่วนลด
                            </label>
                            <div class="input-group">
                                <input type="text" id="discount-code" class="form-control" placeholder="ใส่โค้ดส่วนลด">
                                <button class="btn xez-btn-outline" type="button" onclick="applyDiscount()">
                                    ใช้โค้ด
                                </button>
                            </div>
                            <div id="discount-result" class="mt-2 small"></div>
                        </div>

                        <div class="product-actions">
                            <button class="btn product-buy-btn" onclick="buyProduct()">
                                <i class="fa-solid fa-shopping-cart me-2"></i>สั่งซื้อเลย
                            </button>
                            <button class="btn product-action-btn" onclick="copyProductLink()">
                                <i class="fa-solid fa-code"></i>
                            </button>
                            <button class="btn product-action-btn" onclick="shareProduct()">
                                <i class="fa-solid fa-share-nodes"></i>
                            </button>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-danger mt-4">
                            <i class="fa-solid fa-exclamation-circle me-2"></i>สินค้าหมดชั่วคราว กรุณาติดต่อแอดมิน
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Product Detail Styles */
    .product-detail-card {
        background: var(--bg-card);
        border-radius: 20px;
        padding: 30px;
        border: 1px solid var(--border-color);
    }

    .product-image-wrapper {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(var(--xez-primary-rgb), 0.1) 0%, rgba(var(--xez-primary-rgb), 0.05) 100%);
        border: 3px solid var(--xez-primary);
        padding: 20px;
    }

    .product-main-image {
        width: 100%;
        height: auto;
        border-radius: 12px;
        display: block;
    }

    .product-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.8rem;
    }

    .badge-warning {
        background: #f59e0b;
        color: #fff;
    }

    .badge-danger {
        background: #ef4444;
        color: #fff;
    }

    .product-info {
        padding: 10px 0;
    }

    .product-title {
        font-size: 1.8rem;
        font-weight: 800;
        margin-bottom: 20px;
        color: var(--text-primary);
    }

    .product-description {
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        max-height: 250px;
        overflow-y: auto;
    }

    .description-content {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.8;
    }

    .product-price-box {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }

    .product-price {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--xez-primary);
    }

    .product-stock-info {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 20px;
    }

    .product-quantity {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .qty-btn {
        width: 45px;
        height: 45px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .qty-btn:hover {
        background: var(--xez-primary);
        color: #fff;
        border-color: var(--xez-primary);
    }

    .qty-input {
        width: 80px;
        height: 45px;
        text-align: center;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: 10px;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .product-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .product-buy-btn {
        flex: 1;
        background: linear-gradient(135deg, var(--xez-primary) 0%, var(--xez-secondary) 100%);
        color: #fff;
        padding: 15px 30px;
        font-weight: 600;
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.3s ease;
    }

    .product-buy-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(var(--xez-primary-rgb), 0.4);
        color: #fff;
    }

    .product-action-btn {
        width: 50px;
        height: 50px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .product-action-btn:hover {
        background: var(--xez-primary);
        color: #fff;
        border-color: var(--xez-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .product-detail-card {
            padding: 20px;
        }

        .product-title {
            font-size: 1.4rem;
        }

        .product-buy-btn {
            width: 100%;
            flex: none;
        }
    }
</style>

<script>
    const maxStock = <?= $stock ?>;
    const productId = <?= $product_id ?>;
    const productName = "<?= htmlspecialchars(addslashes($product['name'])) ?>";
    const productPrice = <?= $product['price'] ?>;

    // Discount variables
    let appliedDiscount = null;
    let discountAmount = 0;

    function changeQty(delta) {
        const input = document.getElementById('qty-input');
        let value = parseInt(input.value) + delta;
        if (value < 1) value = 1;
        if (value > maxStock) value = maxStock;
        input.value = value;

        // Re-validate discount if applied
        if (appliedDiscount) {
            applyDiscount();
        }
    }

    function applyDiscount() {
        const code = document.getElementById('discount-code').value.trim();
        const qty = parseInt(document.getElementById('qty-input').value);
        const total = productPrice * qty;

        if (!code) {
            $('#discount-result').html('<span class="text-danger"><i class="fa-solid fa-times-circle me-1"></i>กรุณากรอกโค้ดส่วนลด</span>');
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'system/backend/discount_validate.php',
            data: { code: code, total: total },
            dataType: 'json'
        }).done(function (res) {
            if (res.status === 'success') {
                appliedDiscount = res.discount_id;
                discountAmount = res.discount_amount;
                $('#discount-result').html(`
                    <span class="text-success">
                        <i class="fa-solid fa-check-circle me-1"></i>
                        ใช้โค้ดสำเร็จ! ลด ${res.discount_text} (-฿${res.discount_amount.toLocaleString()})
                    </span>
                `);
            } else {
                appliedDiscount = null;
                discountAmount = 0;
                $('#discount-result').html(`<span class="text-danger"><i class="fa-solid fa-times-circle me-1"></i>${res.message}</span>`);
            }
        }).fail(function () {
            $('#discount-result').html('<span class="text-danger"><i class="fa-solid fa-times-circle me-1"></i>เกิดข้อผิดพลาด</span>');
        });
    }

    function buyProduct() {
        const qty = parseInt(document.getElementById('qty-input').value);

        <?php if (!isset($_SESSION['id'])): ?>
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถซื้อสินค้าได้',
                confirmButtonText: 'เข้าสู่ระบบ',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '?page=login';
                }
            });
            return;
        <?php endif; ?>

        const totalPrice = productPrice * qty;

        Swal.fire({
            title: 'ยืนยันการสั่งซื้อ',
            html: `
            <div class="text-start">
                <p><strong>สินค้า:</strong> ${productName}</p>
                <p><strong>จำนวน:</strong> ${qty} ชิ้น</p>
                <p><strong>ราคารวม:</strong> ${totalPrice.toLocaleString()} บาท</p>
            </div>
        `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันซื้อ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#8b5cf6'
        }).then((result) => {
            if (result.isConfirmed) {
                // Send purchase request
                $.ajax({
                    type: 'POST',
                    url: 'system/buybox.php',
                    data: {
                        id: productId,
                        count: qty
                    },
                    dataType: 'json'
                }).done(function (res) {
                    if (res.salt === 'prize') {
                        Swal.fire({
                            icon: 'success',
                            title: 'สำเร็จ!',
                            html: res.message,
                            confirmButtonText: 'ตกลง'
                        }).then(() => {
                            window.location.href = '?page=buyhis';
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'ผิดพลาด',
                            text: res.message
                        });
                    }
                }).fail(function (xhr) {
                    try {
                        const res = JSON.parse(xhr.responseText);
                        Swal.fire({
                            icon: 'error',
                            title: 'ผิดพลาด',
                            text: res.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
                        });
                    } catch (e) {
                        Swal.fire({
                            icon: 'error',
                            title: 'ผิดพลาด',
                            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
                        });
                    }
                });
            }
        });
    }

    function copyProductLink() {
        navigator.clipboard.writeText(window.location.href);
        Swal.fire({
            icon: 'success',
            title: 'คัดลอกลิงก์แล้ว!',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
        });
    }

    function shareProduct() {
        if (navigator.share) {
            navigator.share({
                title: productName,
                url: window.location.href
            });
        } else {
            copyProductLink();
        }
    }
</script>
