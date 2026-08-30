// Served from /public so it works on any host (Vercel, Cloudflare, etc.) —
// the previous "@/assets/*.asset.json" import only resolves on Lovable's own
// CDN and 404s everywhere else. Put the actual file at public/logo.png.
export const LOGO_URL = "/logo.png";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img
        src={LOGO_URL}
        alt="โลโก้ FLEXZY STORE"
        className="h-8 w-8 rounded-lg object-contain"
        width={32}
        height={32}
      />
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-wide">FLEXZY STORE</span>
      )}
    </span>
  );
}
