<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-history text-xdvz-primary me-2"></i>
            ประวัติการสั่งซื้อสินค้า</h3>
        <p class="text-muted small">บันทึกรายการสั่งซื้อทั้งหมดของลูกค้าภายในร้าน</p>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ผู้ซื้อ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ของรางวัลที่ได้รับ</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">หมวดหมู่สินค้า</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold text-end">วันที่ทำรายการ</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM boxlog ORDER BY date DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <div class="d-flex align-items-center">
                                <div class="avatar-sm me-2 bg-light rounded-circle d-flex align-items-center justify-content-center"
                                    style="width: 28px; height: 28px;">
                                    <i class="fa-solid fa-user text-muted" style="font-size: 0.7rem;"></i>
                                </div>
                                <span
                                    class="text-dark small fw-medium"><?php echo htmlspecialchars($row['username']); ?></span>
                            </div>
                        </td>
                        <td class="py-3 text-dark small">
                            <div class="bg-light-soft px-3 py-1 rounded-2 border-0 d-inline-block">
                                <i class="fa-solid fa-gift text-xdvz-primary me-1"></i>
                                <?php echo htmlspecialchars($row['prize_name']); ?>
                            </div>
                        </td>
                        <td class="py-3 text-center">
                            <span class="badge bg-primary-soft text-primary px-3 rounded-pill fw-normal"
                                style="font-size: 0.7rem;"><?php echo htmlspecialchars($row['category']); ?></span>
                        </td>
                        <td class="py-3 pe-4 text-end text-muted small">
                            <?php echo htmlspecialchars($row['date']); ?>
                        </td>
                    </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" },
            "order": [[0, "desc"]]
        });
    });
</script>