import { Badge } from "@/shared/components/ui/badge";
import type { ProductStatus } from "../types/product";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  if (status === "active") return <Badge variant="secondary">Active</Badge>;
  if (status === "archived") return <Badge variant="outline">Archived</Badge>;
  return <Badge variant="default">Draft</Badge>;
}
