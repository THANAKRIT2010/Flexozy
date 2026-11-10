import https from 'node:https';
// พอร์ตจาก FLEXOZY-API V14.9 (lib/truemoney.js) — ใช้ node:https ตรง ๆ ไม่ต้องเพิ่ม axios · TLS 1.3 · body { mobile }
export const validateGiftLink = (l) => typeof l === 'string' && /^https:\/\/gift\.truemoney\.com\/campaign\/?\?v=[a-zA-Z0-9]+$/.test(l.trim().replace(/\s/g, ''));
export const extractVoucherCode = (l) => { try{ return new URL(String(l).trim().replace(/\s/g, '')).searchParams.get('v'); }catch{ return null; } };
const MSG = { CANNOT_GET_OWN_VOUCHER:'รับซองตัวเองไม่ได้', TARGET_USER_NOT_FOUND:'ไม่พบเบอร์นี้ในระบบ', VOUCHER_NOT_FOUND:'ไม่พบซองอั่งเปาในระบบ', VOUCHER_OUT_OF_STOCK:'มีคนรับซองอั่งเปาไปแล้ว',
  INTERNAL_ERROR:'ไม่พบซองนี้ในระบบ หรือ URL ผิด', VOUCHER_EXPIRED:'ซองนี้หมดอายุแล้ว', BAD_PARAM:'เบอร์ผู้รับเงินของร้านไม่ถูกต้อง', NETWORK_ERROR:'เชื่อมต่อ TrueMoney ไม่ได้' };
export const mapError = (c) => MSG[c] || `เกิดข้อผิดพลาด: ${c}`;
export const shopMobile = () => { const m = String(process.env.TRUEMONEY_MOBILE || '').replace(/\D/g, ''); return /^0\d{9}$/.test(m) ? m : null; };
function post(code, mobile){
  return new Promise((res, rej) => {
    const body = JSON.stringify({ mobile }), req = https.request({ method:'POST', host:'gift.truemoney.com', path:`/campaign/vouchers/${code}/redeem`, minVersion:'TLSv1.3', maxVersion:'TLSv1.3', timeout:15000,
      headers:{ 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(body), 'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36' } },
      (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try{ res(JSON.parse(d)); }catch{ rej(new Error('bad_json')); } }); });
    req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', rej); req.end(body);
  });
}
/** คืน { success, amount(บาท), ownerName } หรือ { success:false, error, message } */
export async function redeemVoucher(link){
  if(!validateGiftLink(link)) return { success:false, error:'INVALID_LINK', message:'รูปแบบลิงก์ซองไม่ถูกต้อง' };
  const mobile = shopMobile(); if(!mobile) return { success:false, error:'BAD_PARAM', message:'ร้านยังไม่ได้ตั้งค่า TRUEMONEY_MOBILE' };
  try{
    const d = await post(extractVoucherCode(link), mobile), c = d?.status?.code;
    if(c === 'SUCCESS') return { success:true, amount:parseFloat(String(d.data.my_ticket.amount_baht).replace(/,/g, '')), ownerName:String(d.data.owner_profile?.full_name || '').trim() };
    return { success:false, error:c || 'INTERNAL_ERROR', message:mapError(c || 'INTERNAL_ERROR') };
  }catch{ return { success:false, error:'NETWORK_ERROR', message:mapError('NETWORK_ERROR') }; }
}
