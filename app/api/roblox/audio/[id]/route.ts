// GET /api/roblox/audio/:id — เสิร์ฟไฟล์เสียง
// มี BLOB_READ_WRITE_TOKEN → ดาวน์โหลดจาก Roblox ครั้งเดียวแล้วเก็บถาวร ครั้งต่อไป redirect ไปไฟล์ที่เก็บไว้
// ไม่มี → proxy จาก Roblox แล้วให้ CDN แคชยาว (s-maxage 1 ปี) เพื่อไม่ให้ยิง Roblox ซ้ำ
import { NextRequest } from "next/server";
import { err } from "@/lib/http";
import { getIp } from "@/lib/ip";
import { LIMITS } from "@/lib/limits";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { downloadAudio, extractId, getRobloxInfo, UpstreamBusy } from "@/lib/roblox";

export const maxDuration = 30;
const PATH = (id: string) => `audio/${id}.mp3`;
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = extractId((await params).id);
  if (!id) return err("invalid_id", 400);

  const redirect = (url: string) => Response.redirect(url, 302);

  if (HAS_BLOB) {
    const { head } = await import("@vercel/blob");
    try { return redirect((await head(PATH(id))).url); } catch { /* ยังไม่เคยแคช */ }
  }

  // ต้องเป็นไฟล์เสียงจริงเท่านั้น (ใช้ผลแคชของ check) กันคนใช้เว็บเราดึงไฟล์อื่นของ Roblox
  try {
    const info = await getRobloxInfo(id);
    if (!info.found || !info.is_audio) return err("not_audio", 404);
  } catch (e) {
    return err(e instanceof UpstreamBusy ? "busy" : "roblox_unreachable", 503, { retry_after: 10 });
  }

  // ดาวน์โหลดใหม่ = งานหนัก จำกัดต่อ IP แยกต่างหาก
  const rl = await rateLimit(LIMITS.audioDownload, getIp(req.headers));
  if (!rl.ok) return tooMany(rl.retryAfter);

  let buf: ArrayBuffer | null;
  try { buf = await downloadAudio(id); } catch (e) {
    return err(e instanceof UpstreamBusy ? "busy" : "roblox_unreachable", 503, { retry_after: 10 });
  }
  if (!buf) return err("unavailable", 502);

  if (HAS_BLOB) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(PATH(id), Buffer.from(buf), { access: "public", contentType: "audio/mpeg", addRandomSuffix: false });
      return redirect(blob.url);
    } catch { /* เก็บไม่สำเร็จ → ส่งไฟล์ตรงๆ */ }
  }
  return new Response(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
