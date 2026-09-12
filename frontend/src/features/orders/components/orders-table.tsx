import { useMemo } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDateTime, formatMoney } from "@/shared/utils/format";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order } from "../types/order";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Order>();

export function OrdersTable({
  orders,
  loading,
}: {
  orders: Order[];
  loading?: boolean;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("orderNumber", {
          header: "Order",
          cell: ({ row }) => (
            <div className="min-w-48">
              <p className="font-mono text-sm font-medium">
                {row.original.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(row.original.createdAt)}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("customerName", {
          header: "Customer",
          cell: ({ row }) => (
            <div className="min-w-44">
              <p className="font-medium">
                {row.original.customerName ?? "Guest customer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.customerPhone ?? row.original.customerEmail ?? "-"}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("governorate", {
          header: "Destination",
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {[row.original.governorate, row.original.cityArea]
                .filter(Boolean)
                .join(", ") || "-"}
            </span>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
        }),
        columnHelper.accessor("total", {
          header: "Total",
          cell: ({ row }) => formatMoney(row.original.total),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/admin/orders/${row.original.id}`}>
                  View
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          ),
        }),
      ]),
    [],
  );
  const table = useTable({ data: orders, columns, features });

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
