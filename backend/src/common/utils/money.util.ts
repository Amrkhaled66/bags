export function moneyToCents(value: string | number): number {
  const normalized = String(value).trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) {
    throw new Error(`Invalid money value: ${normalized}`);
  }

  const [, whole, fraction = ''] = match;

  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function centsToMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function percentageToBasisPoints(value: string | number): number {
  return Math.round(Number(value) * 100);
}

export function calculatePercentageDiscount(
  subtotalCents: number,
  percentage: string | number,
): number {
  return Math.round(
    (subtotalCents * percentageToBasisPoints(percentage)) / 10_000,
  );
}
