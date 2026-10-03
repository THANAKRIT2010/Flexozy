"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play, X } from "lucide-react";
import { api } from "@/lib/client";

export type User = { id: string; name: string; avatar: string; is_admin: boolean };
export type Track = { id: string; name: string; thumbnail?: string | null };
type Toast = { id: number; kind: "success" | "error" | "info"; title: string; text?: string };

type Ctx = {
  user: User | null;
  loaded: boolean;
  toast: (kind: Toast["kind"], title: string, text?: string) => void;
  play: (t: Track) => void;
  playingId: string | null;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [paused, setPaused] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    api("/api/me").then((r) => { if (r.data?.authenticated) setUser(r.data.user); setLoaded(true); });
  }, []);

  const toast = useCallback((kind: Toast["kind"], title: string, text?: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, kind, title, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const play = useCallback((t: Track) => {
    setTrack(t);
    setPaused(false);
    document.body.classList.add("has-player");
    const a = audio.current;
    if (!a) return;
    a.src = `/api/roblox/audio/${t.id}`;
    a.play().catch(() => toast("error", "เล่นไม่ได้", "ไฟล์เสียงนี้โหลดจาก Roblox ไม่ได้ในขณะนี้ (อาจติดลิขสิทธิ์หรือเซิร์ฟเวอร์กำลังคิวเยอะ)"));
  }, [toast]);

  const stop = () => {
    audio.current?.pause();
    setTrack(null);
    document.body.classList.remove("has-player");
  };
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) { a.play(); setPaused(false); } else { a.pause(); setPaused(true); }
  };

  const value = useMemo(() => ({ user, loaded, toast, play, playingId: track?.id ?? null }), [user, loaded, toast, play, track]);

  return (
    <C.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}><b>{t.title}</b>{t.text && <span>{t.text}</span>}</div>
        ))}
      </div>
      <audio ref={audio} onEnded={() => setPaused(true)} preload="none" />
      {track && (
        <div className="player" role="region" aria-label="เครื่องเล่นเสียง">
          {track.thumbnail && /* eslint-disable-next-line @next/next/no-img-element */ <img src={track.thumbnail} alt="" />}
          <div className="t">{track.name}</div>
          <div className={`eq ${paused ? "" : "on"}`}><i /><i /><i /></div>
          <button className="btn ico" onClick={toggle} aria-label={paused ? "เล่น" : "หยุดชั่วคราว"}>{paused ? <Play /> : <Pause />}</button>
          <button className="btn ico" onClick={stop} aria-label="ปิดเครื่องเล่น"><X /></button>
        </div>
      )}
    </C.Provider>
  );
}
