export function baht(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function thaiDate(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}
