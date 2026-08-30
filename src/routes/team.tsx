import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "ทีมงาน — FLEXZY STORE" },
      {
        name: "description",
        content: "รู้จักทีมงาน FLEXZY STORE ผู้ดูแลระบบ ฝ่ายขาย และฝ่ายซัพพอร์ตตลอด 24 ชั่วโมง",
      },
      { property: "og:title", content: "ทีมงาน — FLEXZY STORE" },
      { property: "og:description", content: "ทีมงานผู้ดูแลระบบและซัพพอร์ตของ FLEXZY STORE" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SectionHeader title="ทีมงานของเรา" eyebrow="TEAM" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
          : (data ?? []).map((m) => (
              <article key={m.id} className="surface-card flex flex-col items-center rounded-2xl p-6 text-center">
                <span className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.username} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <h2 className="mt-3 font-display text-base font-semibold">{m.username}</h2>
                {m.role ? <Badge className="mt-2">{m.role}</Badge> : null}
                {m.bio ? <p className="mt-3 text-xs text-muted-foreground">{m.bio}</p> : null}
                {m.handle ? <p className="mt-2 text-xs text-primary">{m.handle}</p> : null}
              </article>
            ))}
      </div>
    </div>
  );
}
