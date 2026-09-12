export type OverviewPeriod = "all" | "7" | "30";

const overviewPeriods: OverviewPeriod[] = ["all", "7", "30"];

export function parseOverviewPeriod(value: string | null): OverviewPeriod {
  return overviewPeriods.includes(value as OverviewPeriod)
    ? (value as OverviewPeriod)
    : "all";
}

export function getOverviewRange(period: OverviewPeriod) {
  if (period === "all") {
    return {};
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(period) + 1);

  return { from: start.toISOString() };
}
