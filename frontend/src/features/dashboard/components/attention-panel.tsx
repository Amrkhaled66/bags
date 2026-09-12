import { ArrowDownLeft, Circle } from "lucide-react";
import type { Overview } from "../types/dashboard";
import { amount } from "../utils/format";

interface AttentionPanelProps {
  overview: Overview;
}

export function AttentionPanel({ overview }: AttentionPanelProps) {
  return (
    <aside className="border-s ps-6 max-xl:border-s-0 max-xl:ps-0">
      <div className="flex items-center justify-between py-[18px]">
        <h2 className="text-sm font-semibold">Needs attention</h2>
        <Circle className="size-3 text-primary" />
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs">
        <span>Pending returns</span>
        <strong className="font-medium tabular-nums">
          {overview.returns.pending}
        </strong>
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs">
        <span>Low stock variants</span>
        <strong className="font-medium tabular-nums text-amber-700">
          {overview.catalog.lowStockVariants}
        </strong>
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs">
        <span>Out of stock variants</span>
        <strong className="font-medium tabular-nums text-rose-700">
          {overview.catalog.outOfStockVariants}
        </strong>
      </div>
      <div className="mt-7 flex items-center justify-between py-[18px]">
        <h2 className="text-sm font-semibold">Payments</h2>
        <ArrowDownLeft className="size-4 text-muted-foreground" />
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs">
        <span>Collected</span>
        <strong className="font-medium tabular-nums">
          {amount(overview.payments.collected)}
        </strong>
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs">
        <span>Refunded</span>
        <strong className="font-medium tabular-nums">
          {amount(overview.payments.refunded)}
        </strong>
      </div>
      <div className="flex justify-between gap-3 border-b py-[13px] text-xs font-medium">
        <span>Net collected</span>
        <strong className="font-medium tabular-nums">
          {amount(overview.payments.netCollected)}
        </strong>
      </div>
    </aside>
  );
}
