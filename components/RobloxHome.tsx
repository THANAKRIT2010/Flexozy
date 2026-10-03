"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Ban, Copy, Pencil, Play, Plus, Search, Star, Trash2 } from "lucide-react";
import { api, extractId } from "@/lib/client";
import { useApp } from "./Providers";

type Sound = { id: string; name: string; creator: string; thumbnail: string | null; genre_id?: string };
type Info = { id: string; name: string; creator: string; thumbnail: string | null; is_audio: boolean };
type Genre = { id: string; title: string };
type Fav = { id: string; name: string; thumbnail: string };

export default function RobloxHome() {
  const { user, toast, play, playingId } = useApp();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Info | null>(null);
  const [catalog, setCatalog] = useState<Sound[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [favs, setFavs] = useState<Fav[]>([]);
  const [tab, setTab] = useState<"catalog" | "favs">("catalog");
  const [genre, setGenre] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Sound | null>(null);

  const loadCatalog = useCallback(async () => {
    const [c, g] = await Promise.all([api<Sound[]>("/api/roblox"), api<Genre[]>("/api/roblox/genres")]);
    if (c.ok) setCatalog(c.data);
    if (g.ok) setGenres(g.data);
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => {
    if (!user) { setFavs([]); return; }
    api<Fav[]>("/api/favorites").then((r) => r.ok && setFavs(r.data));
  }, [user]);

  const favIds = useMemo(() => new Set(favs.map((f) => f.id)), [favs]);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const id = extractId(input);
    if (!id) return toast("error", "ใส่ ID ไม่ถูกต้อง", "กรุณาใส่ Roblox Sound ID หรือลิงก์ที่ถูกต้อง");
    setBusy(true); setResult(null);
    const r = await api<any>(`/api/roblox/check/${id}`);
    setBusy(false);
    if (r.ok) return setResult(r.data);
    if (r.status === 404) toast("error", "ไม่พบ ID นี้", "ตรวจสอบ ID อีกครั้ง");
    else if (r.status === 429) toast("error", "เช็คถี่เกินไป", `รอ ${r.data?.retry_after ?? 30} วินาทีแล้วลองใหม่`);
    else if (r.status === 503 && r.data?.error === "busy") toast("error", "ระบบคิวเยอะ", "ลองใหม่อีกครั้งในอีกสักครู่");
    else toast("error", "เชื่อมต่อ Roblox ไม่สำเร็จ", "ลองใหม่ภายหลัง");
  }

  async function copyId(s: { id: string }) {
    try { await navigator.clipboard.writeText(s.id); toast("success", "คัดลอก ID แล้ว"); } catch { toast("error", "คัดลอกไม่ได้"); }
  }

  async function toggleFav(s: { id: string; name: string; thumbnail: string | null }) {
    if (!user) return toast("info", "ต้องเข้าสู่ระบบก่อน", "login ด้วย Discord เพื่อบันทึกรายการโปรด");
    const r = await api("/api/favorites", { method: "POST", body: JSON.stringify({ id: s.id, name: s.name, thumbnail: s.thumbnail || "" }) });
    if (r.ok) { setFavs(r.data.list); toast("success", r.data.favorited ? "เพิ่มในรายการโปรดแล้ว" : "เอาออกจากรายการโปรดแล้ว"); }
  }

  async function addToCatalog(id: string) {
    const r = await api("/api/roblox", { method: "POST", body: JSON.stringify({ id }) });
    if (r.ok) { toast("success", "เพิ่มเข้าคลังแล้ว"); loadCatalog(); }
    else toast("error", r.status === 409 ? "มีในคลังแล้ว" : r.data?.error === "not_audio_asset" ? "ไม่ใช่ไฟล์เสียง" : "เพิ่มไม่สำเร็จ");
  }

  async function remove(id: string) {
    if (!confirm("ลบเพลงนี้ออกจากคลัง?")) return;
    const r = await api(`/api/roblox/${id}`, { method: "DELETE" });
    if (r.ok) { toast("success", "ลบแล้ว"); loadCatalog(); }
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const f = new FormData(e.currentTarget);
    const r = await api(`/api/roblox/${edit.id}`, { method: "PATCH", body: JSON.stringify({ name: f.get("name"), genre_id: f.get("genre") }) });
    if (r.ok) { toast("success", "บันทึกแล้ว"); setEdit(null); loadCatalog(); } else toast("error", "บันทึกไม่สำเร็จ");
  }

  const list = useMemo(() => {
    const src: Sound[] = tab === "favs" ? favs.map((f) => ({ ...f, creator: "" })) : catalog;
    const s = q.trim().toLowerCase();
    return src.filter((x) => (!genre || tab === "favs" || x.genre_id === genre) && (!s || x.name.toLowerCase().includes(s)));
  }, [tab, favs, catalog, genre, q]);

  const SoundCard = ({ s, showAdmin }: { s: Sound; showAdmin: boolean }) => (
    <div className={`card ${playingId === s.id ? "playing" : ""}`}>
      <button className={`star corner ${favIds.has(s.id) ? "on" : ""}`} onClick={() => toggleFav(s)} aria-label="รายการโปรด"><Star fill={favIds.has(s.id) ? "currentColor" : "none"} /></button>
      {showAdmin && <button className="star corner l" onClick={() => setEdit(s)} aria-label="แก้ไข"><Pencil size={15} /></button>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="th" src={s.thumbnail || ""} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
      <div className="nm" title={s.name}>{s.name}</div>
      {s.creator && <div className="cr">{s.creator}</div>}
      {s.genre_id && genres.find((g) => g.id === s.genre_id) && <span className="tag">{genres.find((g) => g.id === s.genre_id)!.title}</span>}
      <button className="idl" onClick={() => copyId(s)} title="คัดลอก ID"><Copy size={12} />{s.id}</button>
      <div className="acts">
        <button className="btn pri sm" onClick={() => play(s)} aria-label={`เล่น ${s.name}`}><Play /></button>
        {showAdmin && <button className="btn dng sm" style={{ flex: "0 0 36px" }} onClick={() => remove(s.id)} aria-label="ลบ"><Trash2 /></button>}
      </div>
    </div>
  );

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="in">
            <h1>เช็ค Roblox ID<br />ก่อนใช้จริง</h1>
            <p>วาง Sound ID หรือลิงก์จาก Roblox แล้วฟังตัวอย่างได้ทันที หรือเลือกจากคลังเพลงด้านล่าง</p>
            <form className="check" onSubmit={check}>
              <input className="field" inputMode="numeric" placeholder="เช่น 1837879082 หรือวางลิงก์" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Roblox ID" />
              <button className="btn pri" disabled={busy}>{busy ? "กำลังเช็ค..." : "ตรวจสอบ"}</button>
            </form>
            {result && (
              <div className="result">
                <div className="card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="th" src={result.thumbnail || ""} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} style={{ margin: 0 }} />
                  <div className="meta">
                    <div className="nm">{result.name}</div>
                    <div className="cr">โดย {result.creator}</div>
                    <button className="idl" onClick={() => copyId(result)}><Copy size={12} />{result.id}</button>
                    {!result.is_audio && <span className="bad"><Ban size={12} style={{ verticalAlign: -1 }} /> ไม่ใช่ไฟล์เสียง</span>}
                  </div>
                  {result.is_audio && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button className="btn pri ico" onClick={() => play(result)} aria-label="เล่น"><Play /></button>
                      {user?.is_admin && <button className="btn ico" onClick={() => addToCatalog(result.id)} aria-label="เพิ่มเข้าคลัง" title="เพิ่มเข้าคลัง"><Plus /></button>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="wrap">
        {!genre && tab === "catalog" && genres.length > 0 && (
          <div className="genres" role="list">
            {genres.map((g) => (
              <button key={g.id} className="genre" role="listitem" onClick={() => setGenre(g.id)}>
                <b>{g.title}</b><small>{catalog.filter((s) => s.genre_id === g.id).length} รายการ</small>
              </button>
            ))}
          </div>
        )}

        <div className="tabs">
          {genre && <button className="btn sm" onClick={() => setGenre(null)}><ArrowLeft /> {genres.find((g) => g.id === genre)?.title}</button>}
          <button className={`tab ${tab === "catalog" ? "on" : ""}`} onClick={() => setTab("catalog")}>คลังเพลง ({catalog.length})</button>
          <button className={`tab ${tab === "favs" ? "on" : ""}`} onClick={() => { setTab("favs"); setGenre(null); }}>รายการโปรด ({favs.length})</button>
          <div className="search" style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: 12, color: "var(--muted)" }} />
            <input className="field" style={{ paddingLeft: 34 }} placeholder="ค้นหาชื่อเพลง" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหา" />
          </div>
        </div>

        <div className="grid">
          {list.length === 0 && (
            <div className="empty">{tab === "favs" ? (user ? "ยังไม่มีรายการโปรด กดดาวที่เพลงเพื่อบันทึก" : "เข้าสู่ระบบเพื่อดูรายการโปรดของคุณ") : "ไม่พบเพลงที่ตรงกัน"}</div>
          )}
          {list.map((s) => <SoundCard key={s.id} s={s} showAdmin={!!user?.is_admin && tab === "catalog"} />)}
        </div>
      </div>

      {edit && (
        <div className="modal" onClick={() => setEdit(null)}>
          <form className="panel box" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <b>แก้ไขเพลง</b>
            <label className="l" htmlFor="en">ชื่อเพลง</label>
            <input id="en" name="name" className="field" defaultValue={edit.name} maxLength={80} />
            <label className="l" htmlFor="eg">หมวดหมู่</label>
            <select id="eg" name="genre" className="field" defaultValue={edit.genre_id || ""}>
              <option value="">ไม่ระบุ</option>
              {genres.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            <div className="row" style={{ marginTop: 18, justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setEdit(null)}>ยกเลิก</button>
              <button className="btn pri">บันทึก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
