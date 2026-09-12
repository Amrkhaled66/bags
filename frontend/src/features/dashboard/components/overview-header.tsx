import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { OverviewPeriod } from "../utils/overview-period";

interface OverviewHeaderProps {
  isRefreshing: boolean;
  period: OverviewPeriod;
  onPeriodChange: (period: OverviewPeriod) => void;
  onRefresh: () => void;
}

export function OverviewHeader({
  isRefreshing,
  period,
  onPeriodChange,
  onRefresh,
}: OverviewHeaderProps) {
  return (
    <div className="mb-[30px] flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-start">
      <div>
        <p className="mb-[7px] text-[10px] font-semibold text-muted-foreground">
          YOUR STORE AT A GLANCE
        </p>
        <h1 className="text-[28px] font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-2">
          A closer look at your store&apos;s activity.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 items-center gap-2.5 rounded-md border bg-background px-3 text-xs">
          <CalendarDays className="size-4" />
          <select
            className="bg-transparent pe-1.5 outline-none"
            aria-label="Reporting period"
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as OverviewPeriod)
            }
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh overview"
          title="Refresh overview"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}
