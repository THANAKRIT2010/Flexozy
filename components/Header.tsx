"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Shield } from "lucide-react";
import { api } from "@/lib/client";
import { useApp } from "./Providers";

export default function Header() {
  const path = usePathname();
  const { user, loaded } = useApp();
  const on = (p: string) => (p === "/" ? path === "/" : path.startsWith(p)) ? "on" : "";

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/";
  }

  return (
    <header className="hdr">
      <div className="wrap">
        <Link href="/" className="brand">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/images/logo-sm.png" alt="" />FLEXOZY</Link>
        <nav className="nav" aria-label="เมนูหลัก">
          <Link href="/" className={on("/")}>Roblox ID</Link>
          <Link href="/vault" className={on("/vault")}>Vault</Link>
          {user?.is_admin && <Link href="/admin" className={on("/admin")}><Shield size={14} style={{ verticalAlign: -2 }} /> แอดมิน</Link>}
        </nav>
        <div className="sp" />
        {loaded && (user ? (
          <div className="me">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.avatar} alt="" /><span>{user.name}</span>
            <button className="btn ico" onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut /></button>
          </div>
        ) : (
          <a className="btn pri sm" href="/api/auth/discord"><LogIn /> เข้าสู่ระบบ</a>
        ))}
      </div>
    </header>
  );
}
