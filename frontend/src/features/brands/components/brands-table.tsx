import { useMemo } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate } from "@/shared/utils/format";
import { toApiImageUrl } from "@/shared/utils/image-url";
import { BrandStatusBadge } from "./brand-status-badge";
import type { Brand } from "../types/brand";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Brand>();

export function BrandsTable({
  brands,
  loading,
  pendingBrandId,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  brands: Brand[];
  loading?: boolean;
  pendingBrandId?: string | null;
  onEdit: (brand: Brand) => void;
  onActivate: (brand: Brand) => void;
  onDeactivate: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "logo",
      header: "Logo",
      cell: ({ row }) => {
        const url = toApiImageUrl(row.original.logoUrl);
        return (
          <div className="flex size-11 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {url ? (
              <img src={url} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <Badge variant="outline">No logo</Badge>
            )}
          </div>
        );
      },
        }),
        columnHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-48">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
        }),
        columnHelper.accessor("isActive", {
      header: "Status",
      cell: ({ row }) => <BrandStatusBadge isActive={row.original.isActive} />,
        }),
        columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
        }),
        columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const brand = row.original;
        const pending = pendingBrandId === brand.id;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${brand.name}`}
                  disabled={pending}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(brand)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                {brand.isActive ? (
                  <DropdownMenuItem onSelect={() => onDeactivate(brand)}>
                    <PowerOff />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => onActivate(brand)}>
                    <Power />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(brand)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
        }),
      ]),
    [onActivate, onDeactivate, onDelete, onEdit, pendingBrandId],
  );
  const table = useTable({
    data: brands,
    columns,
    features,
  });

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
