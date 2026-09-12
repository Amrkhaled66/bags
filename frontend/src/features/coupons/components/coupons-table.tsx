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
import { formatDate, formatMoney } from "@/shared/utils/format";
import { CouponStatusBadge } from "./coupon-status-badge";
import type { Coupon } from "../types/coupon";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Coupon>();

function isExpired(value: string | null) {
  return value ? new Date(value).getTime() <= Date.now() : false;
}

export function CouponsTable({
  coupons,
  loading,
  pendingCouponId,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  coupons: Coupon[];
  loading?: boolean;
  pendingCouponId?: string | null;
  onEdit: (coupon: Coupon) => void;
  onActivate: (coupon: Coupon) => void;
  onDeactivate: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}) {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("code", {
          header: "Code",
          cell: ({ row }) => (
            <div className="min-w-40">
              <p className="font-mono text-sm font-medium">{row.original.code}</p>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(row.original.createdAt)}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor("percentage", {
          header: "Discount",
          cell: ({ row }) => `${Number(row.original.percentage).toFixed(2)}%`,
        }),
        columnHelper.accessor("minimumOrder", {
          header: "Minimum order",
          cell: ({ row }) => formatMoney(row.original.minimumOrder),
        }),
        columnHelper.accessor("usageLimit", {
          header: "Usage limit",
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.usageLimit ?? "Unlimited"}
            </span>
          ),
        }),
        columnHelper.accessor("expiresAt", {
          header: "Expires",
          cell: ({ row }) => {
            const expired = isExpired(row.original.expiresAt);
            return expired ? (
              <Badge variant="outline">Expired</Badge>
            ) : (
              <span className="text-muted-foreground">
                {row.original.expiresAt
                  ? formatDate(row.original.expiresAt)
                  : "No expiry"}
              </span>
            );
          },
        }),
        columnHelper.accessor("isActive", {
          header: "Status",
          cell: ({ row }) => (
            <CouponStatusBadge isActive={row.original.isActive} />
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => {
            const coupon = row.original;
            const pending = pendingCouponId === coupon.id;
            return (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${coupon.code}`}
                      disabled={pending}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(coupon)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    {coupon.isActive ? (
                      <DropdownMenuItem onSelect={() => onDeactivate(coupon)}>
                        <PowerOff />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => onActivate(coupon)}>
                        <Power />
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete(coupon)}
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
    [onActivate, onDeactivate, onDelete, onEdit, pendingCouponId],
  );
  const table = useTable({ data: coupons, columns, features });

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
