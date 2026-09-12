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
import type { OrderListParams, OrderStatus } from "../types/order";

export function OrdersToolbar({
  draftSearch,
  params,
  isPending,
  onDraftSearchChange,
  onSearchSubmit,
  onFilterChange,
  onReset,
}: {
  draftSearch: string;
  params: OrderListParams;
  isPending?: boolean;
  onDraftSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterChange: (next: Partial<OrderListParams>) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3 border-y bg-muted/20 p-4">
      <form
        className="flex min-w-0 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <Input
          value={draftSearch}
          onChange={(event) => onDraftSearchChange(event.target.value)}
          placeholder="Search order number, customer, or phone..."
          className="max-w-lg"
          disabled={isPending}
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          <Search />
          Search
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Select
          value={params.status ?? "all"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              status: value === "all" ? undefined : (value as OrderStatus),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={params.governorate ?? ""}
          onChange={(event) =>
            onFilterChange({
              governorate: event.target.value.trim() || undefined,
            })
          }
          placeholder="Governorate"
          className="w-40"
          disabled={isPending}
        />
        <Input
          type="date"
          value={params.from?.slice(0, 10) ?? ""}
          onChange={(event) =>
            onFilterChange({
              from: event.target.value
                ? new Date(`${event.target.value}T00:00:00.000`).toISOString()
                : undefined,
            })
          }
          className="w-40"
          disabled={isPending}
        />
        <Input
          type="date"
          value={params.to?.slice(0, 10) ?? ""}
          onChange={(event) =>
            onFilterChange({
              to: event.target.value
                ? new Date(`${event.target.value}T23:59:59.999`).toISOString()
                : undefined,
            })
          }
          className="w-40"
          disabled={isPending}
        />
        <Select
          value={params.sortBy ?? "createdAt"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({ sortBy: value as OrderListParams["sortBy"] })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created date</SelectItem>
            <SelectItem value="total">Total</SelectItem>
            <SelectItem value="orderNumber">Order number</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sortOrder ?? "desc"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({ sortOrder: value as "asc" | "desc" })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
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
