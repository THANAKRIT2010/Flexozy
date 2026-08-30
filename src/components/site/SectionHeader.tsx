import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  eyebrow = "FLEXZY STORE",
  moreTo,
  action,
}: {
  title: string;
  eyebrow?: string;
  moreTo?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/70 pb-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
      </div>
      {action}
      {!action && moreTo && (
        <Link
          to={moreTo}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ดูทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
