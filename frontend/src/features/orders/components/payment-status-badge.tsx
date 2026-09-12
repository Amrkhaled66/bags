import { Badge } from "@/shared/components/ui/badge";
import type { PaymentStatus } from "../types/order";

const labels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus | null | undefined;
}) {
  if (!status) return <Badge variant="outline">No payment</Badge>;
  return (
    <Badge
      variant={
        status === "paid" || status === "partially_refunded"
          ? "secondary"
          : "outline"
      }
    >
      {labels[status]}
    </Badge>
  );
}
