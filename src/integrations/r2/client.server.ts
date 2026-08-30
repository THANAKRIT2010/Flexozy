// Server-side Cloudflare R2 client.
// R2 is S3-compatible, so we sign requests with aws4fetch instead of pulling
// in the full AWS SDK (which doesn't play well with the Cloudflare Workers runtime).
// Load inside server handlers only — this file must never ship to the client bundle.
import { AwsClient } from "aws4fetch";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing R2 environment variable: ${name}. Set it in your Cloudflare/Lovable project settings.`,
    );
  }
  return value;
}

export type R2UploadResult = {
  key: string;
  url: string;
};

/**
 * Uploads a binary object to the configured R2 bucket and returns its public URL.
 * Requires these env vars:
 *  - R2_ACCOUNT_ID       Cloudflare account id
 *  - R2_ACCESS_KEY_ID    R2 API token access key id
 *  - R2_SECRET_ACCESS_KEY  R2 API token secret
 *  - R2_BUCKET_NAME      target bucket name
 *  - R2_PUBLIC_URL       public base URL for the bucket (r2.dev dev URL or a custom domain),
 *                        without a trailing slash
 */
export async function uploadToR2(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<R2UploadResult> {
  const accountId = getEnv("R2_ACCOUNT_ID");
  const accessKeyId = getEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY");
  const bucket = getEnv("R2_BUCKET_NAME");
  const publicBase = getEnv("R2_PUBLIC_URL").replace(/\/+$/, "");

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

  const response = await client.fetch(endpoint, {
    method: "PUT",
    headers: { "content-type": contentType },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`อัปโหลดไป R2 ไม่สำเร็จ (${response.status}): ${detail.slice(0, 300)}`);
  }

  return { key, url: `${publicBase}/${key}` };
}
