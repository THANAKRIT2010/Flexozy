<div class="p-2">
    <div class="mb-4">
        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-clock-rotate-left text-xdvz-primary me-2"></i> ประวัติการสั่งซื้อ</h4>
        <p class="text-muted small">บันทึกรายการสั่งซื้อสินค้าที่คุณเคยทำรายการไว้ในระบบ</p>
    </div>

    <div class="table-responsive">
        <table class="table table-hover border-0" id="table">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold text-center">ลำดับ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">หมวดหมู่ / รายการ</th>
                    <th class="border-0 py-3 text-muted small fw-bold">รายละเอียด / ของรางวัล</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold">วันที่สั่งซื้อ</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                    $q = dd_q("SELECT * FROM boxlog WHERE uid = ? ORDER BY id DESC", [$_SESSION['id']]);
                    $i = 1;
                    while($row = $q->fetch(PDO::FETCH_ASSOC)){
                ?>
                <tr class="align-middle border-bottom">
                    <td class="py-3 ps-4 text-center text-dark small fw-bold"><?= number_format($i) ?></td>
                    <td class="py-3">
                        <span class="badge bg-light-soft text-xdvz-primary px-3 py-2 rounded-3 small">
                           <?= htmlspecialchars($row['category']) ?>
                        </span>
                    </td>
                    <td class="py-3">
                        <span class="text-dark small fw-medium"><?= htmlspecialchars($row['prize_name']) ?></span>
                    </td>
                    <td class="py-3 pe-4 text-muted small"><?= htmlspecialchars($row['date']) ?></td>
                </tr>
                <?php $i++; } ?>
            </tbody>
        </table>
    </div>
</div>

<script>
    $(document).ready(function() {
        $('#table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" },
            "pageLength": 10
        });
    });
</script>