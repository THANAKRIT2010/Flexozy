import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { redeemCode } from "@/lib/commerce.functions";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { baht, thaiDate } from "@/lib/format";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "กระเป๋าเงิน — FLEXZY STORE" },
      { name: "description", content: "ดูยอดเครดิต ประวัติธุรกรรม คำสั่งซื้อ และเติมเงินด้วยโค้ดเติมเงิน" },
      { property: "og:title", content: "กระเป๋าเงิน — FLEXZY STORE" },
      { property: "og:description", content: "ยอดเครดิต ประวัติธุรกรรม และคำสั่งซื้อของคุณ" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { user, profile, loading } = useAuth();
  const qc = useQueryClient();
  const redeem = useServerFn(redeemCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: txs } = useQuery({
    enabled: Boolean(user),
    queryKey: ["wallet_tx", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: orders } = useQuery({
    enabled: Boolean(user),
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อดูกระเป๋าเงินของคุณ</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/auth">เข้าสู่ระบบ</Link>
        </Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await redeem({ data: { code: code.trim() } });
      toast.success(res.message);
      setCode("");
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ใช้โค้ดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SectionHeader title="กระเป๋าเงินของฉัน" eyebrow="WALLET" />

      <div className="surface-card rounded-3xl p-6">
        <p className="eyebrow">ยอดเครดิตคงเหลือ</p>
        <p className="mt-1 font-display text-4xl font-semibold text-gradient">
          {baht(profile?.wallet_balance ?? 0)}
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            value={code}
            maxLength={64}
            onChange={(e) => setCode(e.target.value)}
            placeholder="กรอกโค้ดเติมเงิน / โค้ดของขวัญ"
            className="rounded-full"
          />
          <Button type="submit" className="rounded-full" disabled={busy}>
            ใช้โค้ด
          </Button>
        </form>
      </div>

      <div className="mt-12">
        <SectionHeader title="คำสั่งซื้อล่าสุด" eyebrow="ORDERS" />
        <div className="space-y-3">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.product_title}</p>
                <p className="text-xs text-muted-foreground">{thaiDate(o.created_at)}</p>
              </div>
              <Badge variant="secondary">{o.status}</Badge>
              <span className="text-sm font-semibold text-primary">{baht(o.price)}</span>
            </div>
          ))}
          {(orders ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
          ) : null}
        </div>
      </div>

      <div className="mt-12">
        <SectionHeader title="ประวัติธุรกรรม" eyebrow="HISTORY" />
        <div className="space-y-2">
          {(txs ?? []).map((t) => (
            <div key={t.id} className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.ref ?? t.type}</p>
                <p className="text-xs text-muted-foreground">{thaiDate(t.created_at)}</p>
              </div>
              <span
                className={`text-sm font-semibold ${Number(t.amount) < 0 ? "text-destructive" : "text-success"}`}
              >
                {Number(t.amount) < 0 ? "-" : "+"}
                {baht(Math.abs(Number(t.amount)))}
              </span>
            </div>
          ))}
          {(txs ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีธุรกรรม</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
