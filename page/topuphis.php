<div class="p-2">
    <div class="mb-4">
        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-coins text-xdvz-primary me-2"></i> ประวัติการเติมเงิน
        </h4>
        <p class="text-muted small">รายการประวัติการเติมเงินย้อนหลังของคุณทั้งหมด</p>
    </div>

    <div class="table-responsive">
        <table class="table table-hover border-0" id="table">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ช่องทาง / รายละเอียด</th>
                    <th class="border-0 py-3 text-muted small fw-bold">จำนวนเงิน</th>
                    <th class="border-0 py-3 text-muted small fw-bold">สถานะ</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold">วันที่ / เวลา</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $f = dd_q("SELECT * FROM topup_his WHERE uid = ? ORDER BY date DESC", [$_SESSION['id']]);
                while ($row = $f->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?= $row['id'] ?></td>
                        <td class="py-3">
                            <span class="badge bg-light-soft text-xdvz-primary px-3 py-2 rounded-3 small">
                                <?= htmlspecialchars($row['link'] ?? 'เติมเงิน') ?>
                            </span>
                        </td>
                        <td class="py-3">
                            <span class="text-success fw-bold">
                                + ฿<?= number_format($row['amount'], 2) ?>
                            </span>
                        </td>
                        <td class="py-3">
                            <span class="badge bg-success">สำเร็จ</span>
                        </td>
                        <td class="py-3 pe-4 text-muted small"><?= $row['date'] ?></td>
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
            "pageLength": 10,
            "order": [[0, "desc"]]
        });
    });
</script>