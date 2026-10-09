import { makeChallenge, POW_ZEROS } from './pass';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
// หน้า "กำลังทำการตรวจสอบความปลอดภัย" — ตอบด้วยสถานะ 403 เสมอ (เครื่องมือยิงเว็บจะเห็นเป็น 403 ไม่ใช่ 200)
// เบราว์เซอร์จริง: กดยืนยัน → แก้โจทย์ proof-of-work (+ Cloudflare Turnstile ถ้าตั้ง key ไว้) → ได้ cookie → โหลดหน้าเดิมซ้ำ
export async function challengePage(host){
  const c = await makeChallenge();
  const siteKey = process.env.TURNSTILE_SECRET_KEY ? (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||'') : '';
  const cfg = JSON.stringify({ c, z:POW_ZEROS, k:siteKey }).replace(/</g,'\\u003c');
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>${esc(host)} | กำลังตรวจสอบความปลอดภัย</title><link rel="icon" href="/images/flexozy-logo.png">
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0}
body{background:#000;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Thai",Tahoma,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.w{width:100%;max-width:460px}
.h{font-size:15px;color:#9a9a9a;margin:0 0 8px;word-break:break-all}
h1{font-size:26px;line-height:1.3;margin:0 0 14px;font-weight:700}
p{font-size:14px;line-height:1.75;color:#9a9a9a;margin:0 0 26px}
.b{display:flex;align-items:center;gap:14px;width:100%;background:#0d0d0d;border:1px solid #3a3a3a;border-radius:10px;padding:14px 16px;color:#fff;font:inherit;font-size:15px;cursor:pointer;text-align:left;transition:.18s}
.b:hover:not(:disabled){border-color:#fff;background:#151515}.b:disabled{cursor:default}
.cb{flex:none;width:26px;height:26px;border:2px solid #777;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:.25s}
.b.run .cb{border-radius:50%;border-color:#333;border-top-color:#fff;animation:s .7s linear infinite}
.b.ok .cb{background:#fff;border-color:#fff}.b.ok .cb:after{content:"";width:6px;height:12px;border:solid #000;border-width:0 3px 3px 0;transform:rotate(45deg) translate(-1px,-1px)}
.l{flex:1}.sh{text-align:right;line-height:1.2}.sh b{display:block;font-size:11px;letter-spacing:.14em}.sh small{font-size:9px;color:#777}
#ts{margin-top:14px;min-height:0}.e{display:none;margin-top:14px;border:1px solid #ff6b6b;color:#ff6b6b;border-radius:10px;padding:12px 14px;font-size:13px}
.f{margin-top:26px;font-size:11px;color:#6b6b6b;font-family:Consolas,monospace;word-break:break-all}
@keyframes s{to{transform:rotate(360deg)}}
</style></head><body><div class="w">
<div class="h">${esc(host)}</div>
<h1>กำลังทำการตรวจสอบความปลอดภัย</h1>
<p>เว็บไซต์นี้ใช้บริการรักษาความปลอดภัยเพื่อป้องกันบอตที่เป็นอันตราย หน้านี้จะปรากฏขึ้นในขณะที่เว็บไซต์ตรวจสอบว่าคุณไม่ใช่บอต</p>
<button class="b" id="b" type="button"><span class="cb"></span><span class="l" id="l">ยืนยันว่าคุณเป็นมนุษย์</span><span class="sh"><b>FLEXOZY</b><small>Security</small></span></button>
<div id="ts"></div><div class="e" id="e"></div>
<div class="f">Ray ID: ${esc(c.slice(0,16))} · Flexozy Security</div>
</div>
<noscript><style>.w{display:none}</style><div style="max-width:460px"><h1>Unable to complete</h1><p>The server denied access to the file (HTTP 403). Enable JavaScript to continue.</p></div></noscript>
<script>
(function(){
var K=${cfg},b=document.getElementById('b'),l=document.getElementById('l'),e=document.getElementById('e'),tok='',busy=false,enc=new TextEncoder();
function flags(){var f=0;try{if(navigator.webdriver)f|=1;if(/HeadlessChrome|PhantomJS|Electron/i.test(navigator.userAgent))f|=2;if(!navigator.languages||!navigator.languages.length)f|=4;if(!screen.width||!screen.height)f|=8}catch(x){f|=16}return f}
function fail(t){busy=false;b.className='b';b.disabled=false;l.textContent='ยืนยันว่าคุณเป็นมนุษย์';e.textContent=t;e.style.display='block'}
async function ok(s){var d=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));for(var i=0;i<K.z;i++){var v=(d[i>>1]>>(i%2?0:4))&15;if(v)return false}return true}
async function pow(){var n=0,B=512;for(;;){var p=[];for(var i=0;i<B;i++)p.push(ok(K.c+':'+(n+i)));var r=await Promise.all(p);var j=r.indexOf(true);if(j>=0)return n+j;n+=B}}
if(K.k){var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
s.onload=function(){window.turnstile.render('#ts',{sitekey:K.k,theme:'dark',language:'th',callback:function(t){tok=t},'expired-callback':function(){tok=''},'error-callback':function(){tok=''}})};document.head.appendChild(s)}
b.addEventListener('click',async function(ev){
  if(busy)return;if(!ev.isTrusted)return fail('ไม่สามารถยืนยันได้');
  if(!window.crypto||!crypto.subtle)return fail('เบราว์เซอร์นี้ไม่รองรับการตรวจสอบ (ต้องใช้ HTTPS)');
  busy=true;e.style.display='none';b.className='b run';b.disabled=true;l.textContent='กำลังตรวจสอบ...';
  try{
    var n=await pow();
    if(K.k){l.textContent='กรุณายืนยันตัวตนด้านล่าง';for(var t=0;!tok&&t<600;t++)await new Promise(function(r){setTimeout(r,200)});if(!tok)return fail('หมดเวลา กรุณาลองใหม่')}
    var r=await fetch('/api/challenge/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({c:K.c,n:n,f:flags(),ts:tok}),credentials:'same-origin'});
    if(!r.ok){fail('ยืนยันไม่สำเร็จ กำลังโหลดโจทย์ใหม่...');setTimeout(function(){location.reload()},1500);return}
    b.className='b ok';l.textContent='ยืนยันแล้ว กำลังเข้าสู่เว็บไซต์...';setTimeout(function(){location.reload()},350);
  }catch(x){fail('เกิดข้อผิดพลาด กรุณาลองใหม่')}
});
})();
</script></body></html>`;
  return new Response(html, { status:403, headers:{ 'content-type':'text/html; charset=utf-8', 'cache-control':'no-store', 'x-robots-tag':'noindex, nofollow, noarchive' } });
}
