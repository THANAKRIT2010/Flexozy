"use client";
import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Lock, LogIn, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useApp } from "./Providers";

type Meta = { code: string; title: string; image: string; has_password: boolean; views: number; raw_url: string };
type Created = { code: string; has_password: boolean; raw_url: string };

export default function VaultHome() {
  const { user, loaded, toast } = useApp();
  const [mine, setMine] = useState<Meta[]>([]);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [edit, setEdit] = useState<{ code: string; title: string; image: string; script: string; has_password: boolean } | null>(null);

  const load = useCallback(async () => {
    const r = await api<Meta[]>("/api/vault");
    if (r.ok) setMine(r.data);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const loadstring = (url: string) => `loadstring(game:HttpGet("${url}"))()`;
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast("success", `คัดลอก${label}แล้ว`); } catch { toast("error", "คัดลอกไม่ได้"); }
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const r = await api<any>("/api/vault", { method: "POST", body: JSON.stringify({ title: f.get("title"), image: f.get("image"), script: f.get("script"), password: f.get("password") }) });
    setBusy(false);
    if (r.ok) { setCreated(r.data); form.reset(); load(); toast("success", "สร้างลิงก์แล้ว"); }
    else toast("error", r.status === 429 ? "สร้างบ่อยเกินไป" : r.data?.error === "payload_too_large" ? "โค้ดยาวเกิน 200,000 ตัวอักษร" : "สร้างลิงก์ไม่สำเร็จ", r.status === 429 ? `รอ ${Math.ceil(r.data?.retry_after / 60) || 1} นาที` : undefined);
  }

  async function openEdit(code: string) {
    const r = await api(`/api/vault/${code}`);
    if (!r.ok) return toast("error", "เปิดแก้ไขไม่ได้");
    setEdit({ code, ...r.data });
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { title: f.get("title"), image: f.get("image"), script: f.get("script"), remove_password: f.get("remove") === "on" };
    if (String(f.get("password") || "").trim()) body.password = f.get("password");
    const r = await api(`/api/vault/${edit.code}`, { method: "PUT", body: JSON.stringify(body) });
    if (r.ok) { toast("success", "บันทึกแล้ว"); setEdit(null); load(); } else toast("error", "บันทึกไม่สำเร็จ");
  }

  async function remove(code: string) {
    if (!confirm("ลบลิงก์นี้? จะใช้งานไม่ได้ทันที")) return;
    const r = await api(`/api/vault/${code}`, { method: "DELETE" });
    if (r.ok) { toast("success", "ลบลิงก์แล้ว"); load(); }
  }

  if (loaded && !user) {
    return (
      <div className="wrap" style={{ padding: "70px 20px", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 8px" }}>Vault</h1>
        <p className="muted">เข้าสู่ระบบด้วย Discord เพื่อฝากโค้ดและสร้างลิงก์ loadstring</p>
        <a className="btn pri" href="/api/auth/discord"><LogIn /> เข้าสู่ระบบด้วย Discord</a>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 36 }}>
      <h1 style={{ margin: 0, fontSize: 34 }}>Vault</h1>
      <p className="muted" style={{ margin: "6px 0 0" }}>วางโค้ด แล้วได้ลิงก์ loadstring ทันที ตั้งรหัสผ่านป้องกันการเปิดดูผ่านเว็บได้</p>

      <div className="vgrid">
        <form className="panel" onSubmit={submit}>
          <label className="l" style={{ marginTop: 0 }} htmlFor="t">ชื่อ</label>
          <input id="t" name="title" className="field" maxLength={120} placeholder="ชื่อสคริปต์" />
          <label className="l" htmlFor="s">โค้ด</label>
          <textarea id="s" name="script" className="field" required spellCheck={false} placeholder="print('hello')" maxLength={200000} />
          <div className="row" style={{ alignItems: "start" }}>
            <div style={{ flex: 1 }}>
              <label className="l" htmlFor="p">รหัสผ่าน (ไม่บังคับ)</label>
              <input id="p" name="password" type="password" className="field" maxLength={100} autoComplete="new-password" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="l" htmlFor="i">รูปปก https (ไม่บังคับ)</label>
              <input id="i" name="image" className="field" placeholder="https://..." />
            </div>
          </div>
          <button className="btn pri" style={{ marginTop: 16, width: "100%" }} disabled={busy}>{busy ? "กำลังสร้าง..." : "สร้างลิงก์"}</button>

          {created && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <label className="l" style={{ marginTop: 0 }}>Loadstring</label>
              <div className="row">
                <input className="field ro" readOnly value={loadstring(created.raw_url)} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn ico" onClick={() => copy(loadstring(created.raw_url), " loadstring ")} aria-label="คัดลอก"><Copy /></button>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                {created.has_password ? "รหัสผ่านป้องกันการเปิดดู/คัดลอกโค้ดผ่านเว็บ ส่วน loadstring ด้านบนรันได้เลยไม่ต้องใส่รหัส" : "ใครมีลิงก์นี้จะเปิดและรันโค้ดได้ทันที"}
              </p>
            </div>
          )}
        </form>

        <div className="panel">
          <b>ลิงก์ของฉัน ({mine.length})</b>
          <div style={{ marginTop: 12 }}>
            {mine.length === 0 && <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>ยังไม่มีลิงก์ที่สร้าง</p>}
            {mine.map((v) => (
              <div className="vitem" key={v.code}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {v.image && <img src={v.image} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
                <div className="m">
                  <b>{v.title} {v.has_password && <Lock size={12} style={{ color: "var(--warn)" }} />}</b>
                  <small>{v.views} views · /{v.code}</small>
                </div>
                <a className="btn ico sm" href={`/vault/${v.code}`} target="_blank" rel="noopener" aria-label="เปิดดู"><ExternalLink /></a>
                <button className="btn ico sm" onClick={() => copy(loadstring(v.raw_url), " loadstring ")} aria-label="คัดลอก loadstring"><Copy /></button>
                <button className="btn ico sm" onClick={() => openEdit(v.code)} aria-label="แก้ไข"><Pencil /></button>
                <button className="btn ico sm dng" onClick={() => remove(v.code)} aria-label="ลบ"><Trash2 /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {edit && (
        <div className="modal" onClick={() => setEdit(null)}>
          <form className="panel box" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <b>แก้ไข /{edit.code}</b>
            <label className="l" htmlFor="et">ชื่อ</label>
            <input id="et" name="title" className="field" defaultValue={edit.title} maxLength={120} />
            <label className="l" htmlFor="ei">รูปปก</label>
            <input id="ei" name="image" className="field" defaultValue={edit.image} />
            <label className="l" htmlFor="es">โค้ด</label>
            <textarea id="es" name="script" className="field" defaultValue={edit.script} required spellCheck={false} maxLength={200000} />
            <label className="l" htmlFor="ep">ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)</label>
            <input id="ep" name="password" type="password" className="field" autoComplete="new-password" />
            {edit.has_password && <label className="row muted" style={{ marginTop: 10 }}><input type="checkbox" name="remove" /> ลบรหัสผ่านออก</label>}
            <div className="row" style={{ marginTop: 18, justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setEdit(null)}>ยกเลิก</button>
              <button className="btn pri">บันทึก</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
