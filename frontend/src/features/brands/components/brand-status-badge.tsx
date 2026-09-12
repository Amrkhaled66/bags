import { Badge } from "@/shared/components/ui/badge";

export function BrandStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "secondary" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
