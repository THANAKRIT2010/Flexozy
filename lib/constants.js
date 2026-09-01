export const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "flexozy.xyz";

export const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "mail", "ftp", "smtp", "pop", "imap",
  "ns1", "ns2", "cpanel", "webmail", "cdn", "static", "assets",
  "app", "dashboard", "root", "test", "staging", "dev", "render",
]);

export const MAX_HTML_SIZE_BYTES = 500 * 1024; // 500KB ต่อเว็บ

// a-z, 0-9, - เท่านั้น ยาว 3-30 ตัวอักษร ห้ามขึ้นต้น/ลงท้ายด้วย -
export const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export function normalizeSubdomain(name) {
  return String(name || "").trim().toLowerCase();
}

export function isValidSubdomain(subdomain) {
  return SUBDOMAIN_REGEX.test(subdomain) && !RESERVED_SUBDOMAINS.has(subdomain);
}

export function siteKey(subdomain) {
  return `site:${subdomain}`;
}

export const SITES_INDEX_KEY = "sites:index";
