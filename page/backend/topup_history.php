<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-coins text-xdvz-primary me-2"></i> ประวัติการเติมเงิน
        </h3>
        <p class="text-muted small">ตรวจสอบรายการเติมเงินทั้งหมดของลูกค้าผ่านช่องต่างๆ</p>
    </div>

    <div class="table-responsive">
        <table id="table" class="table table-hover border-0 w-100">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ID</th>
                    <th class="border-0 py-3 text-muted small fw-bold">ข้อมูลอ้างอิง (Link/Slip)</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">จำนวนเงิน</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ผู้ใช้งาน</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold text-end">วันที่เติม</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $get_user = dd_q("SELECT * FROM topup_his ORDER BY date DESC");
                while ($row = $get_user->fetch(PDO::FETCH_ASSOC)) {
                    ?>
                    <tr class="align-middle border-bottom">
                        <td class="py-3 ps-4 text-dark small fw-bold">#<?php echo $row['id']; ?></td>
                        <td class="py-3">
                            <span class="text-muted small d-inline-block text-truncate" style="max-width: 250px;">
                                <?php echo htmlspecialchars($row['link']); ?>
                            </span>
                        </td>
                        <td class="py-3 text-center">
                            <span class="text-success fw-bold">฿<?php echo number_format($row['amount'], 2); ?></span>
                        </td>
                        <td class="py-3 text-center">
                            <span class="text-dark small fw-medium"><?php echo htmlspecialchars($row['uname']); ?></span>
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