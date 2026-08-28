// controllers/wallet.controller.js — ยอดเงินในระบบของผู้ใช้ + เติมเงินผ่าน TrueMoney + ประวัติธุรกรรม
const { nanoid } = require("nanoid");
const { mutate, readDB } = require("../db");
const truemoneyService = require("../services/truemoneyService");
const { checkRateLimit, getClientIp } = require("../utils/rateLimit");

// GET /api/wallet — ดูยอดเงินตัวเอง
async function getWallet(req, res) {
  const db = await readDB();
  const user = db.users[req.session.user.discord_id];
  res.json({ balance: user?.balance || 0 });
}

// GET /api/wallet/transactions — ดูประวัติของตัวเอง (ล่าสุดก่อน)
async function myTransactions(req, res) {
  const db = await readDB();
  const list = db.wallet_transactions
    .filter((t) => t.user_id === req.session.user.discord_id)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 100);
  res.json(list);
}

// POST /api/wallet/topup { link } — แลกซองอั่งเปา TrueMoney แล้วเติมยอดเข้ากระเป๋า
// จำกัดความถี่กันสแปมยิงลิงก์ซ้ำๆ (ลิงก์ที่แลกไปแล้วจะแลกซ้ำไม่ได้อยู่แล้วจาก TrueMoney เอง แต่กันการยิง API รัวๆ ไว้ด้วย)
async function topupTrueMoney(req, res) {
  const rl = await checkRateLimit(`wallet-topup:${getClientIp(req)}`, { limit: 10, windowSeconds: 300 });
  if (!rl.allowed) return res.status(429).json({ error: "too_many_requests", retry_after: rl.retryAfterSeconds });

  const { link } = req.body;
  if (!link || typeof link !== "string") return res.status(400).json({ error: "missing_link" });

  const result = await truemoneyService.redeemVoucher(link.trim());
  if (!result.success) {
    return res.status(400).json({ error: "redeem_failed", message: result.message });
  }

  const userId = req.session.user.discord_id;
  const newBalance = await mutate((db) => {
    const user = db.users[userId];
    user.balance = (user.balance || 0) + result.amount;
    db.wallet_transactions.push({
      id: nanoid(10),
      user_id: userId,
      amount: result.amount,
      type: "topup_truemoney",
      ref: truemoneyService.extractVoucherHash(link.trim()),
      created_at: Math.floor(Date.now() / 1000),
    });
    return user.balance;
  });

  res.json({ success: true, credited: result.amount, balance: newBalance });
}

module.exports = { getWallet, myTransactions, topupTrueMoney };
