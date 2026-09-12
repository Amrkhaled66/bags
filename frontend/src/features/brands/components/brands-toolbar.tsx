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
import type { BrandListParams } from "../types/brand";

export function BrandsToolbar({
  draftSearch,
  params,
  isPending,
  onDraftSearchChange,
  onSearchSubmit,
  onFilterChange,
  onReset,
}: {
  draftSearch: string;
  params: BrandListParams;
  isPending?: boolean;
  onDraftSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterChange: (next: Partial<BrandListParams>) => void;
  onReset: () => void;
}) {
  const statusValue =
    params.isActive === undefined ? "all" : params.isActive ? "active" : "inactive";

  return (
    <div className="flex flex-col gap-3 border-y bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
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
          placeholder="Search brands..."
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
          value={statusValue}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              isActive:
                value === "all" ? undefined : value === "active" ? true : false,
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sortBy ?? "createdAt"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({ sortBy: value as "createdAt" | "name" })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
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
