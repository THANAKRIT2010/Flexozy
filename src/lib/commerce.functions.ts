import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * ทุกการเปลี่ยนแปลงยอดเงินเกิดขึ้นบนเซิร์ฟเวอร์เท่านั้น
 * ผู้ใช้แก้ยอดเงินเองไม่ได้ (ถูกล็อกด้วยกฎในฐานข้อมูลอีกชั้น)
 */

export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username, wallet_balance, banned")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) throw new Error("ไม่พบบัญชีผู้ใช้");
    if (profile.banned) throw new Error("บัญชีนี้ถูกระงับการใช้งาน");

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, title, price, stock, active")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product || !product.active) throw new Error("ไม่พบสินค้านี้");
    if (product.stock <= 0) throw new Error("สินค้าหมดชั่วคราว");

    const price = Number(product.price);
    const balance = Number(profile.wallet_balance);
    if (balance < price) throw new Error("ยอดเงินไม่พอ กรุณาเติมเงินก่อน");

    const { error: balErr } = await supabaseAdmin
      .from("profiles")
      .update({ wallet_balance: balance - price })
      .eq("id", userId)
      .eq("wallet_balance", profile.wallet_balance);
    if (balErr) throw new Error("ตัดยอดเงินไม่สำเร็จ กรุณาลองใหม่");

    await supabaseAdmin
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product.id)
      .gt("stock", 0);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_name: profile.username,
        product_id: product.id,
        product_title: product.title,
        price,
        status: "paid",
      })
      .select("id")
      .single();
    if (orderErr) throw new Error("สร้างคำสั่งซื้อไม่สำเร็จ");

    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: userId,
      amount: -price,
      type: "purchase",
      ref: product.title,
    });

    return { orderId: order.id, balance: balance - price };
  });

export const redeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        code: z
          .string()
          .trim()
          .min(3)
          .max(64)
          .regex(/^[A-Za-z0-9_-]+$/, "รูปแบบโค้ดไม่ถูกต้อง"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const code = data.code.toUpperCase();

    const { data: row } = await supabaseAdmin
      .from("redeem_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (!row || !row.active) throw new Error("โค้ดไม่ถูกต้องหรือถูกปิดใช้งาน");
    if (row.uses >= row.max_uses) throw new Error("โค้ดนี้ถูกใช้ครบจำนวนแล้ว");

    const { error: useErr } = await supabaseAdmin
      .from("redeem_uses")
      .insert({ code, user_id: userId });
    if (useErr) throw new Error("คุณใช้โค้ดนี้ไปแล้ว");

    await supabaseAdmin
      .from("redeem_codes")
      .update({ uses: row.uses + 1 })
      .eq("code", code);

    if (row.reward_type === "wallet") {
      const amount = Number(row.reward_value) || 0;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("wallet_balance")
        .eq("id", userId)
        .maybeSingle();
      const next = Number(profile?.wallet_balance ?? 0) + amount;
      await supabaseAdmin.from("profiles").update({ wallet_balance: next }).eq("id", userId);
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: userId,
        amount,
        type: "redeem_code",
        ref: code,
      });
      return { type: "wallet" as const, message: `เติมเครดิตสำเร็จ +${amount} บาท`, balance: next };
    }

    return { type: row.reward_type, message: row.reward_value, balance: null };
  });
