import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crown, Headphones, Store, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Button } from "@/components/ui/button";
import { baht } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FLEXZY STORE บริการทุกระดับประทับใจ" },
      {
        name: "description",
        content:
          "ร้านค้าออนไลน์ FLEXZY STORE รวมแอปพรีเมียม สคริปต์ Roblox บริการ Discord และเติมเครดิตอัตโนมัติ 24 ชั่วโมง",
      },
      { property: "og:title", content: "FLEXZY STORE บริการทุกระดับประทับใจ" },
      {
        property: "og:description",
        content: "แอปพรีเมียม สคริปต์ Roblox และบริการ Discord พร้อมส่งอัตโนมัติ",
      },
    ],
  }),
  component: Home,
});

const QUICK = [
  { to: "/store", icon: Store, title: "ร้านค้าทั้งหมด", desc: "เลือกดูสินค้าภายในร้าน" },
  { to: "/store", icon: Crown, title: "App Premium", desc: "บัญชีพรีเมียมพร้อมใช้งาน" },
  { to: "/wallet", icon: Wallet, title: "เติมเงิน", desc: "เติมเครดิตเข้าสู่ระบบ" },
  { to: "/partners", icon: Headphones, title: "ติดต่อทีมงาน", desc: "สอบถามและขอความช่วยเหลือ" },
] as const;

function Home() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {settings?.announcement_text ? (
        <div className="mb-6 overflow-hidden rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          {settings.announcement_text}
        </div>
      ) : null}

      <section className="surface-card overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20">
        <p className="eyebrow">{settings?.site_name ?? "FLEXZY STORE"}</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
          <span className="text-gradient">บริการทุกระดับ</span> ประทับใจ
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          {settings?.tagline ?? "เราจะไม่หยุดอยู่กับที่ พร้อมที่จะพัฒนา และทำให้เต็มที่"}
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full">
          <Link to="/store">
            เลือกซื้อสินค้า <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="surface-card group flex items-center gap-4 rounded-2xl px-5 py-5 transition-colors hover:border-primary/60"
          >
            <item.icon className="h-7 w-7 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </section>

      <section className="mt-16">
        <SectionHeader title="หมวดหมู่สินค้า" moreTo="/store" />
        <div className="grid gap-4 sm:grid-cols-2">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              to="/store"
              className="surface-card flex min-h-32 flex-col justify-end rounded-2xl p-6 transition-colors hover:border-primary/60"
            >
              <span className="font-display text-lg font-semibold">{cat.title}</span>
              <span className="text-xs text-muted-foreground">{cat.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionHeader title="สินค้าแนะนำ" moreTo="/store" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))
            : (products ?? []).map((p) => (
                <Link
                  key={p.id}
                  to="/store"
                  className="surface-card flex flex-col rounded-2xl p-4 transition-colors hover:border-primary/60"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-muted">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-2 text-sm font-medium">{p.title}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{p.category}</span>
                  <span className="mt-3 rounded-full bg-secondary px-3 py-1.5 text-center text-sm font-semibold text-primary">
                    {baht(p.price)}
                  </span>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
