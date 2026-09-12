export function amount(value: string | null) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}
