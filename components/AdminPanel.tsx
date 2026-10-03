"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useApp } from "./Providers";

type Genre = { id: string; title: string };
type Meta = { code: string; title: string; owner_name: string; views: number; has_password: boolean };

export default function AdminPanel() {
  const { user, loaded, toast } = useApp();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [vaults, setVaults] = useState<Meta[]>([]);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    const [g, v] = await Promise.all([api<Genre[]>("/api/roblox/genres"), api<Meta[]>("/api/vault?all=1")]);
    if (g.ok) setGenres(g.data);
    if (v.ok) setVaults(v.data);
  }, []);
  useEffect(() => { if (user?.is_admin) load(); }, [user, load]);

  if (!loaded) return null;
  if (!user?.is_admin) return <div className="wrap" style={{ padding: "80px 20px", textAlign: "center" }}><h1>404</h1></div>;

  async function addGenre(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("/api/roblox/genres", { method: "POST", body: JSON.stringify({ title }) });
    if (r.ok) { setTitle(""); load(); } else toast("error", r.status === 409 ? "มีหมวดนี้แล้ว" : "เพิ่มไม่สำเร็จ");
  }
  async function delGenre(id: string) {
    if (confirm("ลบหมวดนี้? เพลงในหมวดจะไม่หาย แต่จะไม่มีหมวด") && (await api(`/api/roblox/genres/${id}`, { method: "DELETE" })).ok) load();
  }
  async function delVault(code: string) {
    if (confirm(`ลบ /${code} ?`) && (await api(`/api/vault/${code}`, { method: "DELETE" })).ok) load();
  }

  return (
    <div className="wrap" style={{ paddingTop: 36 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 30 }}>แอดมิน</h1>
      <p className="muted" style={{ marginTop: 0 }}>เพิ่ม/แก้ไข/ลบเพลงทำได้จากหน้า Roblox ID โดยตรง (จะมีปุ่มเพิ่มเติมสำหรับแอดมิน)</p>
      <div className="vgrid">
        <div className="panel">
          <b>หมวดหมู่เพลง</b>
          <form className="row" style={{ margin: "12px 0" }} onSubmit={addGenre}>
            <input className="field" placeholder="ชื่อหมวดใหม่" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
            <button className="btn pri" disabled={!title.trim()}><Plus /> เพิ่ม</button>
          </form>
          {genres.map((g) => (
            <div className="vitem" key={g.id}><div className="m"><b>{g.title}</b><small>{g.id}</small></div><button className="btn ico sm dng" onClick={() => delGenre(g.id)} aria-label="ลบ"><Trash2 /></button></div>
          ))}
        </div>
        <div className="panel">
          <b>Vault ทั้งหมด ({vaults.length})</b>
          <div style={{ marginTop: 12 }}>
            {vaults.map((v) => (
              <div className="vitem" key={v.code}>
                <div className="m"><b>{v.title}</b><small>/{v.code} · {v.owner_name} · {v.views} views</small></div>
                <a className="btn sm" href={`/vault/${v.code}`} target="_blank" rel="noopener">เปิด</a>
                <button className="btn ico sm dng" onClick={() => delVault(v.code)} aria-label="ลบ"><Trash2 /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
