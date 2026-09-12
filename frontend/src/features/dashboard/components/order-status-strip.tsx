import { cn } from "@/shared/utils/cn";
import type { Overview } from "../types/dashboard";

const orderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const statusDotClasses: Record<(typeof orderStatuses)[number], string> = {
  pending: "bg-[#d9a140]",
  confirmed: "bg-[#648aca]",
  shipped: "bg-[#9976bd]",
  delivered: "bg-[#4e9b74]",
  cancelled: "bg-[#c57f85]",
};

interface OrderStatusStripProps {
  overview: Overview;
}

export function OrderStatusStrip({ overview }: OrderStatusStripProps) {
  return (
    <section
      className="mb-4 grid grid-cols-5 gap-3 border-b py-6 max-sm:grid-cols-2"
      aria-label="Order status"
    >
      {orderStatuses.map((status) => (
        <div className="flex items-center gap-2" key={status}>
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-[#9bada3]",
              statusDotClasses[status],
            )}
          />
          <span className="capitalize text-sm">{status}</span>
          <strong className="ms-auto pe-4 text-sm">
            {overview.orders.byStatus[status] ?? 0}
          </strong>
        </div>
      ))}
    </section>
  );
}
