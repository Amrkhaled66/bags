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
import { formatDateTime } from "@/shared/utils/format";
import { ReturnStatusBadge } from "./return-status-badge";
import type { ReturnRequest } from "../types/return";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, ReturnRequest>();

export function ReturnsTable({
  returns,
  loading,
}: {
  returns: ReturnRequest[];
  loading?: boolean;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("orderNumber", {
          header: "Order",
          cell: ({ row }) => (
            <div className="min-w-44">
              <p className="font-mono text-sm font-medium">
                {row.original.orderNumber ?? row.original.orderId}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(row.original.createdAt)}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("reason", {
          header: "Reason",
          cell: ({ row }) => (
            <p className="line-clamp-2 min-w-64 text-muted-foreground">
              {row.original.reason}
            </p>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => <ReturnStatusBadge status={row.original.status} />,
        }),
        columnHelper.accessor("customerId", {
          header: "Customer",
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.customerId ? "Registered" : "Guest"}
            </span>
          ),
        }),
        columnHelper.accessor("updatedAt", {
          header: "Updated",
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {formatDateTime(row.original.updatedAt)}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/admin/returns/${row.original.id}`}>
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
  const table = useTable({ data: returns, columns, features });

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
