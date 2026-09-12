import { Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ShippingRateListParams } from "../types/shipping-rate";

function statusToValue(value: boolean | undefined) {
  if (value === true) return "active";
  if (value === false) return "inactive";
  return "all";
}

export function ShippingRatesToolbar({
  draftSearch,
  params,
  isPending,
  onDraftSearchChange,
  onSearchSubmit,
  onFilterChange,
  onReset,
}: {
  draftSearch: string;
  params: ShippingRateListParams;
  isPending?: boolean;
  onDraftSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterChange: (next: Partial<ShippingRateListParams>) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-y bg-muted/20 p-4 xl:flex-row xl:items-center xl:justify-between">
      <form
        className="flex min-w-0 flex-1 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <Input
          value={draftSearch}
          onChange={(event) => onDraftSearchChange(event.target.value)}
          placeholder="Search governorates..."
          className="max-w-md"
          disabled={isPending}
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          <Search />
          Search
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusToValue(params.isActive)}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              isActive:
                value === "all" ? undefined : value === "active" ? true : false,
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sortBy ?? "governorate"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              sortBy: value as ShippingRateListParams["sortBy"],
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="governorate">Governorate</SelectItem>
            <SelectItem value="shippingPrice">Shipping price</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sortOrder ?? "asc"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({ sortOrder: value as "asc" | "desc" })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="ghost" onClick={onReset} disabled={isPending}>
          <X />
          Reset
        </Button>
      </div>
    </div>
  );
}
