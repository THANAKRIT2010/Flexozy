import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
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
import { uploadProductImage } from "@/lib/upload.functions";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const doUpload = useServerFn(uploadProductImage);

  async function handleImageFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG, JPEG, WEBP หรือ GIF");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("ไฟล์รูปใหญ่เกินไป (จำกัด 5MB)");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { url } = await doUpload({
        data: { base64, contentType: file.type as (typeof ALLOWED_IMAGE_TYPES)[number] },
      });
      setForm((f) => ({ ...f, image: url }));
      toast.success("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
              <Label htmlFor="p-img">รูปภาพ</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="p-img"
                  maxLength={500}
                  placeholder="อัปโหลดไฟล์ หรือวางลิงก์รูปภาพ"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                {form.image ? (
                  <img src={form.image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(e) => void handleImageFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปจากเครื่อง"}
              </Button>
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
