

<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api_app_premium.byshop.me/api/product', 
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


<div class="container-fluid p-0 ">
    <div class="container-sm  m-cent  p-0 pt-4 ">
        <div class="container-sm ">
            <div class="container-fluid">
                <div class="container-fluid">
				<div class="row justify-content-center justify-content-lg-start">
					<div class="row" >
						<?php 
						foreach ($load_packz as $data) {
						?>

						<!--<div class="col-12 col-lg-3 mb-4 cc aos-init aos-animate" data-aos="zoom-in">
							<div class="card-anim-main bg-glass border-ys shadow p-1" style="border-radius: 1vh; height: fit-content;">
								<div class="container-fluid p-0 ">
									<a href="?page=buyapp&amp;id=<?=$data->id;?>">
									</a>
									<div class="view overlay"><a href="?page=buyapp&amp;id=<?=$data->id;?>">
										<center>
											<img class="img-fluid " src="<?=$data->img;?>" style="border-radius: 1vh; width: 100%; max-width: 100vh;">
										</center>
										</a><a href="#!">
											<div class="mask rgba-white-slight"></div>
										</a>
									</div>
									<div class="card-body p-3 pt-3 pb-1">
										<h5 class="  text-strongest mb-1" style="word-wrap: break-word;"><?=$data->name;?></h5>
										<div class="d-flex justify-content-between">
											<p class="text-main  align-self-center m-0 "><strong><?=$data->price + $byshop_cost;?> บาท</strong></p>
										</div>
										<center>
											<a href="?page=buyapp&amp;id=<?=$data->id;?>" class="btn bg-main w-100  mb-2" style="border-radius: 50px;"><i class="fa-regular fa-shopping-basket"></i>&nbsp;สั่งซื้อตอนนี้เลย</a>
											<p class=" m-0" style="width: fit-content;">สินค้าคงเหลือ <?=$data->stock;?> ชิ้น</p>
										</center>
									</div>
								</div>
							</div>
						</div>	-->

						<div class="col-md-3 col-sm-12 col-12 px-2 d-flex align-items-stretch hvr-float pointer">
							<div class="card crad_tung mb-3 card_new w-100 aos-init aos-animate" style="border-radius: 10px;" data-aos="fade-up">
								<center><img src="<?=$data->img;?>" class="p-4" style="width:11.1rem;"></center>
								<div class="card-body d-flex flex-column text-dark">
									<h5><?=$data->name;?></h5>
									<small><i class="fa-brands fa-creative-commons-share"></i> ประเภทสินค้า 8</small>
									<small><i class="fa-regular fa-circle-user"></i> คงเหลือ <?=$data->stock;?> ชิ้น</small>
									<small><i class="fa-regular fa-clock"></i> สถานะ <?=$data->status;?></small>
								</div>
								<div class="p-2">
									<h6 class="text-dark">$ราคา <?=$data->price + $byshop_cost;?>.00 เครดิค</h6>		
									<?php if ($data->stock >= 1) {?>
										<a href="?page=buyapp&amp;id=<?=$data->id;?>"><button class="btn bg-main text-white w-100 mb-2" style="border-radius: 10px;">สั่งซื้อ (<?=$data->price + $byshop_cost;?>.00 เครดิค)</button></a>
									<?php } else {?>
										<a><button class="btn bg-main disabled text-white w-100 mb-2" style="border-radius: 10px;">สินค้าหมด</button></a>
									<?php }?>
								</div>
							</div>
						</div>

						<?php  } ?>
					</div>
                </div>
            </div>
        </div>
    </div>
</div>