<?php
$curl = curl_init();
$data = array('keyapi' => $byshop_key);
curl_setopt_array($curl, array(
    CURLOPT_URL => 'https://byshop.me/api/history-all',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
));
$response = curl_exec($curl);
curl_close($curl);
$load_packz = json_decode($response);
?>

<div class="p-4 p-lg-5">
    <div class="mb-5">
        <h3 class="fw-bold text-dark mb-1"><i class="fa-solid fa-history text-xdvz-primary me-2"></i>
            ประวัติแอพพรีเมี่ยม (Byshop API)</h3>
        <p class="text-muted small">ตรวจสอบรายการสั่งซื้อแอพพรีเมี่ยมทั้งหมดที่ทำรายการผ่าน Byshop API</p>
    </div>

    <div class="table-responsive">
        <table class="table table-hover border-0 w-100" id="table">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ชื่อรายการ</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ข้อมูลรางวัล</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">แจ้งปัญหา</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold text-end">วันที่</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($load_packz):
                    foreach ($load_packz as $data): ?>
                        <tr class="align-middle border-bottom">
                            <td class="py-3 ps-4 text-dark small fw-bold"><?= htmlspecialchars($data->name); ?></td>
                            <td class="py-3 text-center">
                                <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold view-info-btn"
                                    data-info="Email : <?= htmlspecialchars($data->email); ?> | Password : <?= htmlspecialchars($data->password); ?>">
                                    <i class="fa-solid fa-search me-1"></i> ดูข้อมูล
                                </button>
                            </td>
                            <td class="py-3 text-center">
                                <button class="btn btn-dark btn-sm rounded-pill px-3 fw-bold"
                                    onclick="openReportModal(<?= $data->id ?>)">
                                    <i class="fa-solid fa-wrench me-1"></i> แจ้งปัญหา
                                </button>
                            </td>
                            <td class="py-3 pe-4 text-end text-muted small"><?= $data->time; ?></td>
                        </tr>

                        <!-- Report Modal for each item -->
                        <div class="modal fade" id="report<?= $data->id; ?>" tabindex="-1">
                            <div class="modal-dialog modal-dialog-centered modal-lg">
                                <div class="modal-content rounded-4 border-0 shadow">
                                    <div class="modal-header bg-light border-0">
                                        <h5 class="fw-bold text-dark mb-0">แจ้งปัญหา (OrderID: <?= $data->id ?>)</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body p-0">
                                        <iframe frameborder="0" height="450"
                                            src="https://report_product.byshop.me/api/report/?OrderID=<?= $data->id; ?>"
                                            width="100%" class="rounded-bottom-4"></iframe>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Info Modal -->
<div class="modal fade" id="appInfoModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light border-0">
                <h5 class="fw-bold text-dark mb-0">ข้อมูล App Premium</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="p-3 bg-light-soft rounded-3 border text-dark fw-medium" id="appInfoContent"></div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 py-2 rounded-3"
                    data-bs-dismiss="modal">ปิดหน้านี้</button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $('#table').DataTable({ "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" } });

        $(".view-info-btn").click(function () {
            $("#appInfoContent").text($(this).data("info"));
            new bootstrap.Modal('#appInfoModal').show();
        });
    });

    function openReportModal(id) {
        new bootstrap.Modal('#report' + id).show();
    }
</script>