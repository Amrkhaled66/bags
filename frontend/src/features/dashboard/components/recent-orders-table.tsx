import { ShoppingCart } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { Overview } from "../types/dashboard";
import { amount } from "../utils/format";

type RecentOrder = Overview["orders"]["recent"][number];

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

const statusBadgeClasses: Record<string, string> = {
  pending: "bg-[#fcf5e6] text-[#927023]",
  cancelled: "bg-[#f9edef] text-[#a14c54]",
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between py-[18px]">
        <h2 className="text-sm font-semibold">Recent orders</h2>
        <span className="text-xs text-muted-foreground">Selected period</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start text-xs">
          <thead>
            <tr>
              <th className="whitespace-nowrap bg-muted px-3 py-[13px] text-start font-medium text-muted-foreground">
                Order
              </th>
              <th className="whitespace-nowrap bg-muted px-3 py-[13px] text-start font-medium text-muted-foreground">
                Customer
              </th>
              <th className="whitespace-nowrap bg-muted px-3 py-[13px] text-start font-medium text-muted-foreground">
                Status
              </th>
              <th className="whitespace-nowrap bg-muted px-3 py-[13px] text-end font-medium text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap border-b px-3 py-[13px] font-medium">
                  {order.orderNumber}
                </td>
                <td className="whitespace-nowrap border-b px-3 py-[13px]">
                  {order.customerName ?? "Guest"}
                </td>
                <td className="whitespace-nowrap border-b px-3 py-[13px]">
                  <span
                    className={cn(
                      "rounded bg-[#edf3ef] px-[7px] py-1 capitalize text-[#456853]",
                      statusBadgeClasses[order.status ?? ""] ?? "",
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="whitespace-nowrap border-b px-3 py-[13px] text-end tabular-nums">
                  {amount(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 ? (
        <div className="flex min-h-[230px] flex-col items-center justify-center p-5 text-center">
          <ShoppingCart className="size-8 text-muted-foreground mb-3" />
          <h3 className="font-medium">No orders yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Orders placed in this period will appear here.
          </p>
        </div>
      ) : null}
    </section>
  );
}
