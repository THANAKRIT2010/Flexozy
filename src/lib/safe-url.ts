/**
 * Only allow http(s) links to be rendered as real hrefs.
 * Blocks javascript:, data:, vbscript: and other schemes that
 * could be planted into admin-editable link fields (partners, team, etc.)
 * and used for phishing / stored XSS if that data ever gets exposed
 * through a compromised admin session or a future public-write policy.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // not a valid absolute URL
  }
  return undefined;
}
