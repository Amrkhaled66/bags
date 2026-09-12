import { Badge } from "@/shared/components/ui/badge";
import type { ReturnStatus } from "../types/return";

const labels: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  completed: "Completed",
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return (
    <Badge
      variant={
        status === "rejected" || status === "completed" ? "outline" : "secondary"
      }
    >
      {labels[status]}
    </Badge>
  );
}
