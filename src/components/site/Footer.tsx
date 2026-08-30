import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Brand />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} FLEXZY STORE — บริการทุกระดับประทับใจ
        </p>
      </div>
    </footer>
  );
}
