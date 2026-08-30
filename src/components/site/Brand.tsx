import logoAsset from "@/assets/flexzy-logo.png.asset.json";

export const LOGO_URL = logoAsset.url;

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
