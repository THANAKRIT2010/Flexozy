"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void }; }
}

export default function VerifyForm() {
  const params = useSearchParams();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [msg, setMsg] = useState("กรุณายืนยันว่าคุณไม่ใช่บอทก่อนเข้าเว็บ");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.NODE_ENV === "production" ? "" : "1x00000000000000000000AA");

  const onToken = useCallback(async (token: string) => {
    setBusy(true); setBad(false); setMsg("กำลังตรวจสอบ...");
    const r = await api("/api/verify", { method: "POST", body: JSON.stringify({ token }) });
    if (r.ok) {
      const next = params.get("next") || "/";
      location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return;
    }
    setBusy(false); setBad(true);
    setMsg(r.status === 429 ? "ลองบ่อยเกินไป กรุณารอสักครู่" : r.status === 503 ? "ระบบยังตั้งค่าไม่ครบ (ติดต่อผู้ดูแล)" : "ยืนยันไม่สำเร็จ ลองใหม่อีกครั้ง");
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [params]);

  const render = useCallback(() => {
    if (!box.current || !window.turnstile || widget.current || !siteKey) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey, theme: "dark", callback: onToken,
      "error-callback": () => { setBad(true); setMsg("โหลดแบบทดสอบไม่สำเร็จ ลองรีเฟรชหน้า"); },
      "expired-callback": () => window.turnstile?.reset(widget.current || undefined),
    });
    setReady(true);
  }, [onToken, siteKey]);

  useEffect(() => { if (ready || window.turnstile) render(); }, [ready, render]);

  return (
    <div className="vbox">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.png" alt="Flexozy" />
      <h1>ยืนยันตัวตน</h1>
      <p className={bad ? "err" : "muted"} role="status">{msg}</p>
      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
          <div className="cf" ref={box} aria-busy={busy} />
        </>
      ) : (
        <p className="err">ยังไม่ได้ตั้งค่า NEXT_PUBLIC_TURNSTILE_SITE_KEY</p>
      )}
    </div>
  );
}
