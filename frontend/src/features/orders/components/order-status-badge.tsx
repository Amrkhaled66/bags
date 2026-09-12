import { Badge } from "@/shared/components/ui/badge";
import type { OrderStatus } from "../types/order";

const labels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  return (
    <Badge variant={status === "cancelled" ? "outline" : "secondary"}>
      {labels[status]}
    </Badge>
  );
}
