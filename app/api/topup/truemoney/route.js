import { NextResponse } from 'next/server';
import { getUser } from '@/lib/session';
import { addTokens, claimVoucher, setVoucher, pushTopup, hit } from '@/lib/db';
import { validateGiftLink, extractVoucherCode, redeemVoucher, shopMobile } from '@/lib/truemoney';
export const dynamic = 'force-dynamic'; export const maxDuration = 30;
const rate = () => Math.max(1, Number(process.env.TOKEN_PER_BAHT) || 100);       // 1 บาท = กี่ TOKEN
const err = (error, message, status) => NextResponse.json({ error, message }, { status });
// รับซองอั่งเปา TrueMoney เข้าเบอร์ร้าน (TRUEMONEY_MOBILE) → เครดิต TOKEN = ยอดที่ TrueMoney ยืนยัน × TOKEN_PER_BAHT
export async function POST(req){
  const user = await getUser(); if(!user) return err('not_authenticated', 'กรุณาเข้าสู่ระบบก่อน', 401);
  if(process.env.TOPUP_TM === '0') return err('disabled', 'ปิดรับเติมเงินชั่วคราว', 503);
  if(!shopMobile()) return err('not_configured', 'ร้านยังไม่ได้ตั้งค่า TRUEMONEY_MOBILE', 503);
  let b = {}; try{ b = await req.json(); }catch{}
  const link = String(b.voucher || '').trim();
  if(!validateGiftLink(link)) return err('bad_link', 'ลิงก์ต้องเป็นแบบ https://gift.truemoney.com/campaign/?v=...', 400);
  if(await hit('tmn:' + user.id, 600) > 6) return err('rate_limited', 'ลองถี่เกินไป รอสักครู่แล้วลองใหม่', 429);
  const code = extractVoucherCode(link), at = Date.now();
  const c = await claimVoucher(code, { uid:String(user.id), status:'pending', at });
  if(!c.ok) return err('used', c.status === 'credited' ? 'ซองนี้ถูกใช้เติมเงินไปแล้ว' : 'ซองนี้กำลังถูกตรวจสอบ ติดต่อแอดมินถ้าเงินเข้าแล้ว', 409);
  const r = await redeemVoucher(link);
  if(!r.success){
    if(r.error === 'NETWORK_ERROR'){ await setVoucher(code, { status:'review', error:r.error }); return err('review', 'ยืนยันผลการรับซองไม่ได้ แอดมินจะตรวจสอบและเติมให้ถ้าเงินเข้าแล้ว', 502); }
    await setVoucher(code, { status:'failed', error:r.error }); return err(r.error, r.message, 400);
  }
  const tokens = Math.floor(r.amount * rate());
  if(!(tokens > 0)){ await setVoucher(code, { status:'review', error:'NO_AMOUNT', amount:r.amount }); return err('review', 'ไม่พบยอดเงินในซอง แอดมินจะตรวจสอบให้', 502); }
  let balance; try{ balance = await addTokens(String(user.id), tokens); }
  catch{ await setVoucher(code, { status:'review', error:'credit_failed', amount:r.amount, tokens }); return err('review', 'รับซองแล้วแต่เติม TOKEN ไม่สำเร็จ ติดต่อแอดมิน', 500); }
  await setVoucher(code, { status:'credited', amount:r.amount, tokens, done:Date.now() });
  await pushTopup(String(user.id), { at, baht:r.amount, tokens, ref:code.slice(0, 4) + '••••' + code.slice(-3) }).catch(() => {});
  return NextResponse.json({ ok:true, baht:r.amount, tokens, balance });
}
