import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Vault — FLEXZY STORE" },
      {
        name: "description",
        content: "คลังเก็บสคริปต์ส่วนตัว เปิดดูด้วยรหัส Vault และคัดลอกไปใช้งานได้ทันที",
      },
      { property: "og:title", content: "Vault — FLEXZY STORE" },
      { property: "og:description", content: "คลังเก็บสคริปต์ส่วนตัว เปิดดูด้วยรหัส Vault" },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  const [code, setCode] = useState("");
  const [opened, setOpened] = useState<{ title: string; script: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: recent, isLoading } = useQuery({
    queryKey: ["vault_recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vault_items")
        .select("id, code, title, views, owner_name, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  async function open(target?: string) {
    const value = (target ?? code).trim();
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(value)) {
      toast.error("รูปแบบรหัส Vault ไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("vault_items")
      .select("title, script")
      .eq("code", value)
      .maybeSingle();
    setLoading(false);
    if (!data) {
      toast.error("ไม่พบรหัส Vault นี้");
      return;
    }
    setOpened(data);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SectionHeader title="เปิด Vault" eyebrow="VAULT" />

      <div className="surface-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row">
        <Input
          value={code}
          maxLength={64}
          onChange={(e) => setCode(e.target.value)}
          placeholder="กรอกรหัส Vault เช่น ABC123"
          className="rounded-full"
        />
        <Button className="rounded-full" disabled={loading} onClick={() => void open()}>
          <Lock className="h-4 w-4" /> เปิดดู
        </Button>
      </div>

      {opened ? (
        <div className="surface-card mt-6 rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{opened.title}</h2>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                void navigator.clipboard.writeText(opened.script);
                toast.success("คัดลอกแล้ว");
              }}
            >
              <Copy className="h-4 w-4" /> คัดลอก
            </Button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl bg-secondary p-4 text-xs leading-relaxed">
            {opened.script}
          </pre>
        </div>
      ) : null}

      <div className="mt-12">
        <SectionHeader title="Vault ล่าสุด" eyebrow="RECENT" />
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            : (recent ?? []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => void open(v.code)}
                  className="surface-card rounded-2xl p-4 text-left transition-colors hover:border-primary/60"
                >
                  <span className="block truncate text-sm font-medium">{v.title}</span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>รหัส {v.code}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {v.views}
                    </span>
                  </span>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
