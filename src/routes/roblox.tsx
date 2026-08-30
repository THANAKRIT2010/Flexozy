import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/roblox")({
  head: () => ({
    meta: [
      { title: "เพลง Roblox — FLEXZY STORE" },
      {
        name: "description",
        content: "ค้นหารหัสเพลง Roblox หลายร้อยรายการ แยกตามหมวดหมู่ คัดลอก ID ได้ทันที",
      },
      { property: "og:title", content: "เพลง Roblox — FLEXZY STORE" },
      { property: "og:description", content: "ค้นหารหัสเพลง Roblox แยกตามหมวดหมู่ คัดลอกได้ทันที" },
    ],
  }),
  component: RobloxPage,
});

function RobloxPage() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("all");

  const { data: genres } = useQuery({
    queryKey: ["roblox_genres"],
    queryFn: async () => {
      const { data } = await supabase
        .from("roblox_genres")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const { data: sounds, isLoading } = useQuery({
    queryKey: ["roblox_sounds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("roblox_sounds")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const list = (sounds ?? []).filter(
    (s) =>
      (genre === "all" || s.genre_id === genre) &&
      `${s.name} ${s.id}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  async function copy(id: string) {
    await navigator.clipboard.writeText(id);
    toast.success(`คัดลอกรหัส ${id} แล้ว`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeader title="รหัสเพลง Roblox" eyebrow="ROBLOX SOUNDS" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          maxLength={80}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อเพลงหรือรหัส..."
          className="rounded-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGenre("all")}
            className={`rounded-full border px-4 py-1.5 text-xs ${genre === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
          >
            ทั้งหมด
          </button>
          {(genres ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`rounded-full border px-4 py-1.5 text-xs ${genre === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {g.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          : list.slice(0, 300).map((s) => (
              <button
                key={s.id}
                onClick={() => void copy(s.id)}
                className="surface-card flex items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:border-primary/60"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-medium">
                    {s.name}
                    {s.verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{s.id}</span>
                </span>
                <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
      </div>
      {!isLoading && list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">ไม่พบเพลงที่ค้นหา</p>
      ) : null}
    </div>
  );
}
