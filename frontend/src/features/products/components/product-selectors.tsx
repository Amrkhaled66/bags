import type { ReactNode } from "react";
import { useBrandSelectorOptions } from "@/features/brands";
import { useCategorySelectorOptions } from "@/features/categories";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export function BrandSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const brands = useBrandSelectorOptions();
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="No brand" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No brand</SelectItem>
        {(brands.data ?? []).map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategoryChecklist({
  value,
  disabled,
  onChange,
}: {
  value: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  const categories = useCategorySelectorOptions();
  const selected = new Set(value);

  return (
    <div className="max-h-48 overflow-y-auto rounded-md border p-2">
      {(categories.data ?? []).length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted-foreground">
          No categories available.
        </p>
      ) : (
        <div className="space-y-1">
          {(categories.data ?? []).map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={selected.has(category.id)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...value, category.id]
                      : value.filter((id) => id !== category.id),
                  );
                }}
              />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category.slug}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryFilterSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const categories = useCategorySelectorOptions();
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {(categories.data ?? []).map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FieldLabel({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return <Label htmlFor={id}>{children}</Label>;
}
