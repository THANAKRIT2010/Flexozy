"use client";
// หน้าเปิดดู vault — สไตล์ตัวดูโค้ด (Script / Loadstring / Raw / Copy / Views) เหมือนหน้า paste เดิม
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, FileText } from "lucide-react";
import hljs from "highlight.js/lib/core";
import lua from "highlight.js/lib/languages/lua";
import { api } from "@/lib/client";
import { useApp } from "./Providers";

hljs.registerLanguage("lua", lua);
type Meta = { title: string; has_password: boolean; views: number; raw_url: string };

export default function VaultView({ code }: { code: string }) {
  const { toast } = useApp();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [missing, setMissing] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"script" | "loadstring">("loadstring");
  const [copied, setCopied] = useState(false);

  const unlock = async (password?: string) => {
    setBusy(true);
    const r = await api(`/api/vault/${code}/unlock`, { method: "POST", body: JSON.stringify({ password }) });
    setBusy(false);
    if (r.ok) { setScript(r.data.script); setMode(r.data.script.split("\n").filter((l: string) => l.trim()).length > 100 ? "loadstring" : "script"); }
    else if (r.status === 401) toast("error", "รหัสผ่านไม่ถูกต้อง");
    else if (r.status === 429) toast("error", "ลองผิดหลายครั้งเกินไป", `รอ ${Math.ceil((r.data?.retry_after || 60) / 60)} นาที`);
    else toast("error", "เปิดลิงก์ไม่สำเร็จ");
  };

  useEffect(() => {
    api<Meta>(`/api/vault/${code}/meta`).then((r) => {
      if (!r.ok) return setMissing(true);
      setMeta(r.data);
      if (!r.data.has_password) unlock();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const loadstring = meta ? `loadstring(game:HttpGet("${meta.raw_url}"))()` : "";
  const shown = mode === "script" ? script || "" : loadstring;
  const html = useMemo(() => hljs.highlight(shown, { language: "lua" }).value, [shown]);

  async function copy() {
    try { await navigator.clipboard.writeText(shown); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { toast("error", "คัดลอกไม่ได้"); }
  }

  if (missing) return <div className="wrap" style={{ padding: "80px 20px", textAlign: "center" }}><h1>ไม่พบลิงก์นี้</h1><p className="muted">อาจถูกลบไปแล้ว</p></div>;

  return (
    <div className="wrap">
      <div className="viewer">
        <div className="bar">
          <span className="fn">{meta?.title || "..."}</span>
          {script !== null && (
            <div className="seg" role="tablist">
              <button role="tab" aria-selected={mode === "script"} className={mode === "script" ? "on" : ""} onClick={() => setMode("script")}>Script</button>
              <button role="tab" aria-selected={mode === "loadstring"} className={mode === "loadstring" ? "on" : ""} onClick={() => setMode("loadstring")}>Loadstring</button>
            </div>
          )}
          {meta && <a className="btn sm" href={meta.raw_url} target="_blank" rel="noopener"><FileText /> Raw</a>}
          {script !== null && <button className={`btn sm ${copied ? "pri" : ""}`} onClick={copy}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}</button>}
          {meta && <span className="views"><Eye size={13} style={{ verticalAlign: -2 }} /> {meta.views.toLocaleString()}</span>}
        </div>

        {script !== null ? (
          <pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
        ) : meta?.has_password ? (
          <form style={{ padding: 22 }} onSubmit={(e) => { e.preventDefault(); unlock(pw); }}>
            <p className="muted" style={{ marginTop: 0 }}>ลิงก์นี้ตั้งรหัสผ่านไว้</p>
            <div className="row">
              <input className="field" type="password" placeholder="รหัสผ่าน" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus aria-label="รหัสผ่าน" />
              <button className="btn pri" disabled={busy || !pw}>ปลดล็อก</button>
            </div>
          </form>
        ) : (
          <p className="muted" style={{ padding: 22, margin: 0 }}>กำลังโหลด...</p>
        )}
      </div>
    </div>
  );
}
