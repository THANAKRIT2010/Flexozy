import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Heart, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/scripts")({
  head: () => ({
    meta: [
      { title: "สคริปต์ Roblox — FLEXZY STORE" },
      {
        name: "description",
        content: "รวมสคริปต์ Roblox คัดสรร คัดลอกใช้งานได้ทันที อัปเดตใหม่ต่อเนื่อง",
      },
      { property: "og:title", content: "สคริปต์ Roblox — FLEXZY STORE" },
      { property: "og:description", content: "รวมสคริปต์ Roblox คัดสรร คัดลอกใช้งานได้ทันที" },
    ],
  }),
  component: ScriptsPage,
});

function ScriptsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scripts")
        .select("*")
        .eq("approved", true)
        .order("likes", { ascending: false });
      return data ?? [];
    },
  });

  const list = (data ?? []).filter((s) =>
    `${s.title} ${s.game}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  async function copy(code: string) {
    await navigator.clipboard.writeText(code);
    toast.success("คัดลอกสคริปต์แล้ว");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeader title="สคริปต์ทั้งหมด" eyebrow="SCRIPTS" />
      <Input
        value={q}
        maxLength={80}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาสคริปต์หรือชื่อเกม..."
        className="mb-6 max-w-sm rounded-full"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
          : list.map((s) => (
              <article key={s.id} className="surface-card flex flex-col rounded-2xl p-4">
                <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-muted">
                  {s.image ? (
                    <img src={s.image} alt={s.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <h3 className="line-clamp-1 text-sm font-medium">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.game}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {s.key_system ? (
                    <Badge variant="secondary">
                      <KeyRound className="mr-1 h-3 w-3" /> Key System
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    <Heart className="mr-1 h-3 w-3" /> {s.likes}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">โดย {s.author_name}</span>
                </div>
                <Button variant="secondary" className="mt-3 rounded-full" onClick={() => void copy(s.script)}>
                  <Copy className="h-4 w-4" /> คัดลอกสคริปต์
                </Button>
              </article>
            ))}
      </div>
      {!isLoading && list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">ยังไม่มีสคริปต์ที่ตรงกับการค้นหา</p>
      ) : null}
    </div>
  );
}
