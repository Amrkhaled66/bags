import { Link } from "react-router";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDateTime, formatMoney } from "@/shared/utils/format";
import type { ReturnDetail } from "../types/return";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function ReturnSummaryPanel({ returnRequest }: { returnRequest: ReturnDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Return summary</h2>
      <Separator className="my-4" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow
          label="Order"
          value={
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to={`/admin/orders/${returnRequest.orderId}`}>
                {returnRequest.orderNumber ?? returnRequest.orderId}
              </Link>
            </Button>
          }
        />
        <DetailRow
          label="Customer"
          value={returnRequest.customerId ? "Registered customer" : "Guest checkout"}
        />
        <DetailRow
          label="Created"
          value={formatDateTime(returnRequest.createdAt)}
        />
        <DetailRow
          label="Updated"
          value={formatDateTime(returnRequest.updatedAt)}
        />
      </dl>
      <Separator className="my-4" />
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Reason</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {returnRequest.reason}
        </p>
      </div>
    </section>
  );
}

export function ReturnItemsPanel({ returnRequest }: { returnRequest: ReturnDetail }) {
  return (
    <section className="overflow-hidden rounded-md border bg-background">
      <div className="border-b p-5">
        <h2 className="text-base font-semibold">Returned items</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Returned</TableHead>
            <TableHead>Ordered</TableHead>
            <TableHead>Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returnRequest.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-medium">{item.productName ?? "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.colorName ?? "No color"}
                </p>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {item.sku ?? "-"}
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.orderedQuantity ?? "-"}</TableCell>
              <TableCell>{formatMoney(item.finalUnitPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

export function RefundsPanel({ returnRequest }: { returnRequest: ReturnDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Refunds</h2>
      <Separator className="my-4" />
      {returnRequest.refunds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No refund has been recorded.
        </p>
      ) : (
        <div className="space-y-4">
          {returnRequest.refunds.map((refund) => (
            <div key={refund.id} className="space-y-2 rounded-md border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{formatMoney(refund.amount)}</p>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(refund.refundedAt ?? refund.createdAt)}
                </span>
              </div>
              {refund.notes && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {refund.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
