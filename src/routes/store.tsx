import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { purchaseProduct } from "@/lib/commerce.functions";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { baht } from "@/lib/format";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "ร้านค้า — FLEXZY STORE" },
      {
        name: "description",
        content: "เลือกซื้อแอปพรีเมียม บริการ Discord และไอเทมเกม ราคาสบายกระเป๋า ส่งอัตโนมัติ",
      },
      { property: "og:title", content: "ร้านค้า — FLEXZY STORE" },
      { property: "og:description", content: "แอปพรีเมียม บริการ Discord และไอเทมเกมพร้อมส่ง" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const buy = useServerFn(purchaseProduct);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const cats = useMemo(
    () => ["all", ...new Set((products ?? []).map((p) => p.category ?? "อื่นๆ"))],
    [products],
  );

  const list = (products ?? []).filter(
    (p) =>
      (cat === "all" || (p.category ?? "อื่นๆ") === cat) &&
      p.title.toLowerCase().includes(q.trim().toLowerCase()),
  );

  async function handleBuy(id: string) {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ");
      return;
    }
    setBusy(id);
    try {
      await buy({ data: { productId: id } });
      toast.success("สั่งซื้อสำเร็จ ตรวจสอบได้ที่หน้ากระเป๋าเงิน");
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "สั่งซื้อไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeader title="ร้านค้าทั้งหมด" eyebrow="STORE" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          maxLength={80}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="rounded-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? "ทั้งหมด" : c}
            </button>
          ))}
        </div>
        {profile ? (
          <span className="text-xs text-muted-foreground sm:ml-auto">
            ยอดเงินคงเหลือ <b className="text-primary">{baht(profile.wallet_balance)}</b>
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
          : list.map((p) => (
              <article key={p.id} className="surface-card flex flex-col rounded-2xl p-4">
                <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-muted">
                  {p.image ? (
                    <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <h3 className="line-clamp-2 text-sm font-medium">{p.title}</h3>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-primary">{baht(p.price)}</span>
                  <Badge variant={p.stock > 0 ? "secondary" : "destructive"}>
                    {p.stock > 0 ? `เหลือ ${p.stock}` : "หมด"}
                  </Badge>
                </div>
                <Button
                  className="mt-3 w-full rounded-full"
                  disabled={p.stock <= 0 || busy === p.id}
                  onClick={() => void handleBuy(p.id)}
                >
                  {busy === p.id ? "กำลังสั่งซื้อ..." : "สั่งซื้อ"}
                </Button>
              </article>
            ))}
      </div>
      {!isLoading && list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">ไม่พบสินค้าที่ค้นหา</p>
      ) : null}
    </div>
  );
}
