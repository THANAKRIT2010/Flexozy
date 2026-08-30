import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 5MB base64-encoded ceiling keeps product images small and the R2 bill near zero.
const MAX_BASE64_LENGTH = 7_000_000; // ~5MB of raw bytes once decoded

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * รูปสินค้าอัปโหลดตรงไป Cloudflare R2 จากแผงควบคุมแอดมินเท่านั้น
 * (แทนที่การก็อปลิงก์จาก Vercel Blob ด้วยมือ)
 */
export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        base64: z.string().min(1).max(MAX_BASE64_LENGTH),
        contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่อัปโหลดรูปได้");
    }

    const { uploadToR2 } = await import("@/integrations/r2/client.server");

    const extension = ALLOWED_TYPES[data.contentType];
    const key = `products/${crypto.randomUUID()}.${extension}`;
    const bytes = base64ToBytes(data.base64);

    if (bytes.byteLength > 5_000_000) {
      throw new Error("ไฟล์รูปใหญ่เกินไป (จำกัด 5MB)");
    }

    const { url } = await uploadToR2(key, bytes, data.contentType);
    return { url };
  });
