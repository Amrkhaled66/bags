import { Search, X } from "lucide-react";
import { useBrandSelectorOptions } from "@/features/brands";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { CategoryFilterSelect } from "./product-selectors";
import type { ProductListParams, ProductStatus } from "../types/product";

function booleanFilterValue(value?: boolean) {
  if (value === undefined) return "all";
  return value ? "true" : "false";
}

export function ProductsToolbar({
  draftSearch,
  params,
  isPending,
  onDraftSearchChange,
  onSearchSubmit,
  onFilterChange,
  onReset,
}: {
  draftSearch: string;
  params: ProductListParams;
  isPending?: boolean;
  onDraftSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onFilterChange: (next: Partial<ProductListParams>) => void;
  onReset: () => void;
}) {
  const brands = useBrandSelectorOptions();

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
          placeholder="Search products by name, slug, or SKU..."
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
              status: value === "all" ? undefined : (value as ProductStatus),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.brandId ?? "all"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({ brandId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {(brands.data ?? []).map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CategoryFilterSelect
          value={params.categoryId ?? "all"}
          disabled={isPending}
          onChange={(value) =>
            onFilterChange({ categoryId: value === "all" ? undefined : value })
          }
        />
        <Select
          value={booleanFilterValue(params.isFeatured)}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              isFeatured: value === "all" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Featured</SelectItem>
            <SelectItem value="true">Featured only</SelectItem>
            <SelectItem value="false">Not featured</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.sortBy ?? "createdAt"}
          disabled={isPending}
          onValueChange={(value) =>
            onFilterChange({
              sortBy: value as "createdAt" | "name" | "sellerPrice",
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="sellerPrice">Price</SelectItem>
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
