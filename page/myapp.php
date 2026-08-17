<?php
$curl = curl_init();
$data = array('keyapi' => $byshop_key, 'username_customer' => $user["id"]);
curl_setopt_array($curl, array(
    CURLOPT_URL => 'https://byshop.me/api/history-all',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_CUSTOMREQUEST => 'POST',
));
$response = curl_exec($curl);
curl_close($curl);
$load_packz = json_decode($response);
?>

<div class="p-2">
    <div class="mb-4">
        <h4 class="fw-bold text-dark mb-1"><i class="fa-solid fa-cube text-xdvz-primary me-2"></i> ประวัติแอพพรีเมี่ยม
        </h4>
        <p class="text-muted small">ตรวจสอบรายละเอียดการสั่งซื้อและข้อมูลไอดีแอพพรีเมี่ยมของคุณ</p>
    </div>

    <div class="table-responsive">
        <table class="table table-hover border-0" id="table">
            <thead class="bg-light">
                <tr>
                    <th class="border-0 py-3 ps-4 text-muted small fw-bold">ชื่อรายการ / สินค้า</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">ดูข้อมูล</th>
                    <th class="border-0 py-3 text-muted small fw-bold text-center">แจ้งปัญหา</th>
                    <th class="border-0 py-3 pe-4 text-muted small fw-bold text-end">วันที่สั่งซื้อ</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($load_packz):
                    foreach ($load_packz as $data): ?>
                        <tr class="align-middle border-bottom">
                            <td class="py-3 ps-4">
                                <span class="text-dark fw-bold small"><?= htmlspecialchars($data->name) ?></span>
                            </td>
                            <td class="py-3 text-center">
                                <button class="btn btn-dark btn-sm rounded-pill px-3 view-info-btn" data-bs-toggle="modal"
                                    data-bs-target="#appInfoModal"
                                    data-info="<strong>Email:</strong> <?= htmlspecialchars($data->email) ?><br><strong>Password:</strong> <?= htmlspecialchars($data->password) ?>">
                                    <i class="fa-solid fa-eye me-1"></i> ดูไอดี
                                </button>
                            </td>
                            <td class="py-3 text-center">
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" data-bs-toggle="modal"
                                    data-bs-target="#report<?= $data->id ?>">
                                    <i class="fa-solid fa-triangle-exclamation me-1"></i> แจ้งปัญหา
                                </button>
                            </td>
                            <td class="py-3 pe-4 text-end text-muted small"><?= $data->time ?></td>
                        </tr>

                        <!-- Modal แจ้งปัญหา -->
                        <div class="modal fade" id="report<?= $data->id ?>" tabindex="-1">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content rounded-4 border-0 shadow">
                                    <div class="modal-header border-0 pb-0">
                                        <h5 class="fw-bold text-dark mb-0">แจ้งปัญหาการใช้งาน</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body">
                                        <iframe frameborder="0" height="450"
                                            src="https://report_product.byshop.me/api/report/?OrderID=<?= $data->id ?>"
                                            width="100%"></iframe>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal ดูข้อมูล -->
<div class="modal fade" id="appInfoModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header bg-light rounded-top-4 border-0">
                <h5 class="fw-bold text-dark mb-0">รายละเอียดบัญชีพรีเมี่ยม</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 text-center">
                <div id="appInfoContent" class="p-3 bg-light rounded-3 border"></div>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-dark w-100 rounded-3" data-bs-dismiss="modal">ตกลง</button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function () {
        $(".view-info-btn").click(function () {
            var appInfo = $(this).data("info");
            $("#appInfoContent").html(appInfo);
        });
        $('#table').DataTable({
            "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json" },
            "pageLength": 10
        });
    });
</script>