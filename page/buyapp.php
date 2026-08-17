
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css?family=Sarabun:100,200,400,300,500,600,700" rel="stylesheet">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
	<link rel="stylesheet" href="https://css_script.byshop.me/buy/css/fontawesome-5.2.0.css">
	<link rel="stylesheet" href="https://css_script.byshop.me/buy/buy/_dist/css/styles.css">
	<link rel="stylesheet" href="https://css_script.byshop.me/buy/_dist/css/bootstrap.min.css">
	<link rel="stylesheet"href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css"/>
	<script src="https://css_script.byshop.me/buy/_dist/js/jquery.min.js"></script>
	<script src="https://css_script.byshop.me/buy/_dist/js/datatables.min.js"></script>
	<script src="https://css_script.byshop.me/buy/_dist/js/bootstrap.min.js"></script>

<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api_app_premium.byshop.me/api/product?id='.$_GET['id'], 
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
));

$response = curl_exec($curl);
curl_close($curl);
$load_packz = json_decode($response);

?>

<?php 
	foreach ($load_packz as $data) {
?>
                <div class="container mt-3 mb-3">
                    <div class="container-sm">
                        <div class="bg-white shadow p-3">
 
                            <div class="row">
                                <div class="col-12 col-lg-6 p-3">
                                    <div class="d-flex justify-content-center">
                                        <img src="<?= $data->img ?>" style="width: 60%;" class="rounded">
                                    </div>
                                </div>
                                <div class="col-12 col-lg-6 p-3">
                                    <div class="<?php echo $bg ?> shadow p-3 rounded">
                                        <h3 style="text-decoration: none; color: #000000;">สินค้า : <b><?= $data->name; ?><b></h3>
                                        <div class="row mt-2">
                                            
                                            <?php echo $data->product_info; ?>
                                            <div class="col">
                                                <hr>
                                            </div>
                                            <div class="d-flex justify-content-between pe-3 ps-3 mt-2">
                                                <span class="m-0 align-self-center">สินค้าคงเหลือ <?= $data->stock ?> ชิ้น</span>
                                                <span class="m-0 align-self-center">ราคา <?= $data->price + $byshop_cost ?> บาท</span>
                                            </div>
                                        </div>
                                        <?php if ($data->stock >= 1) {?>
                                            <button class="btn w-100 mt-2 text-white" id="shop-btn" onclick="buyapp()" data-stock="<?= $data->stock ?>" data-id="<?= $data->id ?>" data-name="<?= $data->name ?>" data-price="<?= $data->price + $byshop_cost ?>" style="background-color: var(--main);">สั่งซื้อ</button>
                                        <?php } else {?>
                                            <button class="btn w-100 mt-2 text-white" id="shop-btnX" style="background-color: var(--main);">สินค้าหมด</button>
                                        <?php }?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
<?php  } ?>








<script>
                function buyapp() {
                    var appname = $("#shop-btn").attr("data-name");
                    var appprice = $("#shop-btn").attr("data-price");
                    var formData = new FormData();
                    formData.append('id', $("#shop-btn").attr("data-id"));

                    Swal.fire({
                        title: 'ยืนยันการสั่งซื้อ?',
                        text: appname + " ราคา " + appprice + " บาท ",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'ซื้อเลย'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            $.ajax({
                                type: 'POST',
                                url: 'system/buyapp.php',
                                data: formData,
                                contentType: false,
                                processData: false,
                                beforeSend: function() {
                                    $('#btn_buyid').attr('disabled', 'disabled');
                                    $('#btn_buyid').html('<span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>รอสักครู่...');
                                },
                            }).done(function(res) {
                                console.log(res)
                                result = res;
                                // await GShake();
                                Swal.fire({
                                    icon: 'success',
                                    title: 'สำเร็จ',
                                    text: result.message
                                });
                                console.clear();
                                $('#btn_buyid').html('<i class="fas fa-shopping-cart mr-1"></i>สั่งซื้อสินค้า');
                                $('#btn_buyid').removeAttr('disabled');
                            }).fail(function(jqXHR) {
                                console.log(jqXHR)
                                res = jqXHR.responseJSON;
                                Swal.fire({
                                    icon: 'error',
                                    title: 'ผิดพลาด',
                                    text: res.message
                                });

                                $('#btn_buyid').html('<i class="fas fa-shopping-cart mr-1"></i>สั่งซื้อสินค้า');
                                $('#btn_buyid').removeAttr('disabled');
                            });
                        }
                    })
                }
</script>




