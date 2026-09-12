import { useMemo } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
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
import { formatOptionalMoney } from "@/shared/utils/format";
import { ShippingRateStatusBadge } from "./shipping-rate-status-badge";
import type { ShippingRate } from "../types/shipping-rate";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, ShippingRate>();

export function ShippingRatesTable({
  shippingRates,
  loading,
  pendingShippingRateId,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  shippingRates: ShippingRate[];
  loading?: boolean;
  pendingShippingRateId?: string | null;
  onEdit: (shippingRate: ShippingRate) => void;
  onActivate: (shippingRate: ShippingRate) => void;
  onDeactivate: (shippingRate: ShippingRate) => void;
  onDelete: (shippingRate: ShippingRate) => void;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("governorate", {
          header: "Governorate",
          cell: ({ row }) => (
            <p className="min-w-44 font-medium">{row.original.governorate}</p>
          ),
        }),
        columnHelper.accessor("shippingPrice", {
          header: "Shipping price",
          cell: ({ row }) => formatOptionalMoney(row.original.shippingPrice),
        }),
        columnHelper.accessor("freeShippingThreshold", {
          header: "Free shipping from",
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {formatOptionalMoney(row.original.freeShippingThreshold)}
            </span>
          ),
        }),
        columnHelper.accessor("isActive", {
          header: "Status",
          cell: ({ row }) => (
            <ShippingRateStatusBadge isActive={row.original.isActive} />
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => {
            const shippingRate = row.original;
            const pending = pendingShippingRateId === shippingRate.id;
            return (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${shippingRate.governorate}`}
                      disabled={pending}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(shippingRate)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    {shippingRate.isActive ? (
                      <DropdownMenuItem onSelect={() => onDeactivate(shippingRate)}>
                        <PowerOff />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => onActivate(shippingRate)}>
                        <Power />
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete(shippingRate)}
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
    [
      onActivate,
      onDeactivate,
      onDelete,
      onEdit,
      pendingShippingRateId,
    ],
  );
  const table = useTable({ data: shippingRates, columns, features });

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
