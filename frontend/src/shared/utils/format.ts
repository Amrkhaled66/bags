export function formatMoney(value?: string | null) {
  if (!value) return "-";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EGP",
  }).format(Number(value));
}

export function formatOptionalMoney(value?: string | null) {
  return value ? formatMoney(value) : "None";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
