import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { baht } from "@/lib/format";

const NAV = [
  { to: "/", label: "หน้าหลัก" },
  { to: "/store", label: "ร้านค้า" },
  { to: "/scripts", label: "สคริปต์" },
  { to: "/roblox", label: "เพลง Roblox" },
  { to: "/vault", label: "Vault" },
  { to: "/partners", label: "พาร์ทเนอร์" },
  { to: "/team", label: "ทีมงาน" },
] as const;

export function Header() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="shrink-0">
          <Brand />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-foreground text-background hover:text-background" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/wallet"
                className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm sm:flex"
              >
                <Wallet className="h-4 w-4 text-primary" />
                {baht(profile?.wallet_balance ?? 0)}
              </Link>
              {isAdmin && (
                <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" /> แอดมิน
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="ออกจากระบบ">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">เข้าสู่ระบบ</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="เมนู">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card">
              <SheetTitle className="sr-only">เมนู</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    activeProps={{ className: "bg-secondary text-foreground" }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/wallet"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  กระเป๋าเงิน
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    แอดมิน
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
