import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "พาร์ทเนอร์ — FLEXZY STORE" },
      {
        name: "description",
        content: "รายชื่อพาร์ทเนอร์และชุมชนที่ร่วมงานกับ FLEXZY STORE พร้อมลิงก์เข้าร่วม Discord",
      },
      { property: "og:title", content: "พาร์ทเนอร์ — FLEXZY STORE" },
      { property: "og:description", content: "พาร์ทเนอร์และชุมชนที่ร่วมงานกับ FLEXZY STORE" },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partners")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SectionHeader title="พาร์ทเนอร์ของเรา" eyebrow="PARTNERS" />
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          : (data ?? []).map((p) => (
              <article key={p.id} className="surface-card flex gap-4 rounded-2xl p-5">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-semibold">{p.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                  {p.discord_invite ? (
                    <Button asChild size="sm" variant="secondary" className="mt-3 rounded-full">
                      <a href={p.discord_invite} target="_blank" rel="noopener noreferrer">
                        เข้าร่วม Discord
                      </a>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
      </div>
    </div>
  );
}
