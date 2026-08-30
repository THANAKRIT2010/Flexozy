import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { baht, thaiDate } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "แผงควบคุมผู้ดูแล — FLEXZY STORE" },
      { name: "description", content: "จัดการสินค้า คำสั่งซื้อ โค้ดเติมเงิน และรายงานของ FLEXZY STORE" },
      { property: "og:title", content: "แผงควบคุมผู้ดูแล — FLEXZY STORE" },
      { property: "og:description", content: "จัดการสินค้าและคำสั่งซื้อของ FLEXZY STORE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", price: "", stock: "1", category: "", image: "" });
  const [codeForm, setCodeForm] = useState({ code: "", amount: "", maxUses: "1" });

  const { data: products } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin_products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: orders } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin_orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: reports } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin_reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  if (loading) return <div className="px-4 py-24 text-center text-sm text-muted-foreground">กำลังโหลด...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-xl font-semibold">เฉพาะผู้ดูแลระบบ</h1>
        <p className="mt-2 text-sm text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/">กลับหน้าหลัก</Link>
        </Button>
      </div>
    );
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.title.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      toast.error("กรอกข้อมูลสินค้าให้ถูกต้อง");
      return;
    }
    const { error } = await supabase.from("products").insert({
      title: form.title.trim().slice(0, 120),
      price,
      stock,
      category: form.category.trim().slice(0, 60) || null,
      image: form.image.trim().slice(0, 500) || null,
      type: "product",
      active: true,
    });
    if (error) {
      toast.error("เพิ่มสินค้าไม่สำเร็จ");
      return;
    }
    toast.success("เพิ่มสินค้าแล้ว");
    setForm({ title: "", price: "", stock: "1", category: "", image: "" });
    await qc.invalidateQueries({ queryKey: ["admin_products"] });
  }

  async function toggleProduct(id: string, active: boolean) {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin_products"] });
  }

  async function addCode(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(codeForm.amount);
    const maxUses = Number(codeForm.maxUses);
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(codeForm.code.trim()) || !Number.isFinite(amount) || amount <= 0) {
      toast.error("กรอกโค้ดและจำนวนเงินให้ถูกต้อง");
      return;
    }
    const { error } = await supabase.from("redeem_codes").insert({
      code: codeForm.code.trim().toUpperCase(),
      reward_type: "wallet",
      reward_value: String(amount),
      max_uses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : 1,
      active: true,
    });
    if (error) {
      toast.error("สร้างโค้ดไม่สำเร็จ (อาจซ้ำ)");
      return;
    }
    toast.success("สร้างโค้ดแล้ว");
    setCodeForm({ code: "", amount: "", maxUses: "1" });
  }

  async function resolveReport(id: string) {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin_reports"] });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SectionHeader title="แผงควบคุมผู้ดูแล" eyebrow="ADMIN" />
      <Tabs defaultValue="products">
        <TabsList className="rounded-full">
          <TabsTrigger value="products" className="rounded-full">สินค้า</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-full">คำสั่งซื้อ</TabsTrigger>
          <TabsTrigger value="codes" className="rounded-full">โค้ด</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-full">รายงาน</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 space-y-6">
          <form onSubmit={addProduct} className="surface-card grid gap-3 rounded-2xl p-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-title">ชื่อสินค้า</Label>
              <Input id="p-title" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">ราคา (บาท)</Label>
              <Input id="p-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">จำนวนคงเหลือ</Label>
              <Input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cat">หมวดหมู่</Label>
              <Input id="p-cat" maxLength={60} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-img">ลิงก์รูปภาพ</Label>
              <Input id="p-img" maxLength={500} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <Button type="submit" className="rounded-full sm:col-span-2">เพิ่มสินค้า</Button>
          </form>

          <div className="space-y-2">
            {(products ?? []).map((p) => (
              <div key={p.id} className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{baht(p.price)} · เหลือ {p.stock}</p>
                </div>
                <Badge variant={p.active ? "secondary" : "destructive"}>{p.active ? "เปิดขาย" : "ปิด"}</Badge>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => void toggleProduct(p.id, p.active)}>
                  สลับสถานะ
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-2">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.product_title}</p>
                <p className="text-xs text-muted-foreground">{o.buyer_name} · {thaiDate(o.created_at)}</p>
              </div>
              <span className="text-sm font-semibold text-primary">{baht(o.price)}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <form onSubmit={addCode} className="surface-card grid gap-3 rounded-2xl p-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="c-code">โค้ด</Label>
              <Input id="c-code" maxLength={64} value={codeForm.code} onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-amt">มูลค่า (บาท)</Label>
              <Input id="c-amt" type="number" min={1} value={codeForm.amount} onChange={(e) => setCodeForm({ ...codeForm, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-max">ใช้ได้กี่ครั้ง</Label>
              <Input id="c-max" type="number" min={1} value={codeForm.maxUses} onChange={(e) => setCodeForm({ ...codeForm, maxUses: e.target.value })} />
            </div>
            <Button type="submit" className="rounded-full sm:col-span-3">สร้างโค้ด</Button>
          </form>
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-2">
          {(reports ?? []).map((r) => (
            <div key={r.id} className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.reason}</p>
                <p className="text-xs text-muted-foreground">{r.type} · {r.target_label}</p>
              </div>
              <Badge variant="secondary">{r.status}</Badge>
              {r.status !== "resolved" ? (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => void resolveReport(r.id)}>
                  ปิดเคส
                </Button>
              ) : null}
            </div>
          ))}
          {(reports ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ไม่มีรายงาน</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
