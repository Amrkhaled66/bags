import { useMemo } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";
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
import { formatDate, formatMoney } from "@/shared/utils/format";
import { ProductStatusBadge } from "./product-status-badge";
import { toApiImageUrl } from "@/shared/utils/image-url";
import type { Product } from "../types/product";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Product>();

export function ProductsTable({
  products,
  loading,
  pendingProductId,
  onEdit,
  onDelete,
}: {
  products: Product[];
  loading?: boolean;
  pendingProductId?: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "image",
          header: "Image",
          cell: ({ row }) => {
            const url = toApiImageUrl(row.original.imageUrl);
            return (
              <div className="flex size-11 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {url ? (
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Badge variant="outline">No image</Badge>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("name", {
          header: "Product",
          cell: ({ row }) => (
            <div className="min-w-56">
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
        }),
        columnHelper.accessor("brand", {
          header: "Brand",
          cell: ({ row }) =>
            row.original.brand ? (
              <span>{row.original.brand.name}</span>
            ) : (
              <span className="text-muted-foreground">No brand</span>
            ),
        }),
        columnHelper.accessor("sellerPrice", {
          header: "Price",
          cell: ({ row }) => (
            <div>
              <p>{formatMoney(row.original.sellerPrice)}</p>
              {row.original.discountedPrice && (
                <p className="text-xs text-muted-foreground">
                  Sale {formatMoney(row.original.discountedPrice)}
                </p>
              )}
            </div>
          ),
        }),
        columnHelper.display({
          id: "flags",
          header: "Flags",
          cell: ({ row }) => (
            <div className="flex gap-1">
              {row.original.isFeatured && <Badge variant="outline">Featured</Badge>}
              {row.original.isNewArrival && <Badge variant="outline">New</Badge>}
              {!row.original.isFeatured && !row.original.isNewArrival && (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          ),
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
            const product = row.original;
            return (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${product.name}`}
                      disabled={pendingProductId === product.id}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/admin/products/${product.id}`}>
                        <Eye />
                        Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(product)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete(product)}
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
    [onDelete, onEdit, pendingProductId],
  );
  const table = useTable({ data: products, columns, features });

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
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
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
