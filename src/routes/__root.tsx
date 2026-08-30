import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";

// Served from /public so it works on any host (Vercel, Cloudflare, etc.) —
// the previous "@/assets/*.asset.json" import only resolves on Lovable's own
// CDN and 404s everywhere else. Put the actual file at public/bg-dark.png.
const BG_URL = "/bg-dark.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">ไม่พบหน้านี้</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          หน้าที่คุณกำลังหาอาจถูกย้ายหรือถูกลบไปแล้ว
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const missingSupabaseEnv = error?.message?.includes("Missing Supabase environment variable");

  if (missingSupabaseEnv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-lg text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ยังไม่ได้ตั้งค่าฐานข้อมูล (Supabase)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เว็บนี้ต้องเชื่อมต่อ Supabase ก่อนถึงจะใช้งานได้ แต่ตอนนี้ยังไม่พบค่า Environment
            Variables ที่จำเป็นบนเซิร์ฟเวอร์ที่ deploy อยู่
          </p>
          <p className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-xs text-muted-foreground">
            ผู้ดูแลเว็บ: ไปที่ตั้งค่า Environment Variables ของโฮสต์ที่ deploy (เช่น Vercel →
            Project Settings → Environment Variables) แล้วเพิ่ม
            <code className="mx-1 rounded bg-muted px-1 py-0.5">VITE_SUPABASE_URL</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5">VITE_SUPABASE_PUBLISHABLE_KEY</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5">SUPABASE_URL</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5">SUPABASE_PUBLISHABLE_KEY</code> และ
            <code className="mx-1 rounded bg-muted px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>
            แล้วกด Redeploy อีกครั้ง
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          โหลดหน้านี้ไม่สำเร็จ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          เกิดข้อผิดพลาดบางอย่าง ลองรีเฟรชอีกครั้งหรือกลับหน้าหลัก
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FLEXZY STORE บริการทุกระดับประทับใจ" },
      {
        name: "description",
        content: "เราจะไม่หยุดอยู่กับที่ พร้อมที่จะพัฒนา และทำให้เต็มที่",
      },
      { property: "og:site_name", content: "FLEXZY STORE" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="brand-backdrop flex min-h-screen flex-col"
        style={{ ["--brand-backdrop-image" as string]: `url(${BG_URL})` }}
      >
        <Header />
        <main className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
