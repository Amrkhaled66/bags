import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { formatDateTime, formatMoney } from "@/shared/utils/format";
import { PaymentStatusBadge } from "./payment-status-badge";
import type { OrderDetail } from "../types/order";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function OrderCustomerPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Customer</h2>
      <Separator className="my-4" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Name" value={order.customerName ?? "Guest customer"} />
        <DetailRow
          label="Account"
          value={order.customerId ? "Registered customer" : "Guest checkout"}
        />
        <DetailRow label="Phone" value={order.customerPhone ?? "-"} />
        <DetailRow label="Email" value={order.customerEmail ?? "-"} />
      </dl>
    </section>
  );
}

export function OrderAddressPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Shipping address</h2>
      <Separator className="my-4" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Governorate" value={order.governorate ?? "-"} />
        <DetailRow label="City / area" value={order.cityArea ?? "-"} />
        <DetailRow
          label="Street address"
          value={order.streetAddress ?? "-"}
        />
      </dl>
    </section>
  );
}

export function OrderItemsPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="overflow-hidden rounded-md border bg-background">
      <div className="border-b p-5">
        <h2 className="text-base font-semibold">Items</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Unit</th>
              <th className="px-4 py-3 text-left font-medium">Qty</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.productName ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.colorName ?? "No color"}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {item.sku ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(item.finalUnitPrice)}
                </td>
                <td className="px-4 py-3">{item.quantity ?? 0}</td>
                <td className="px-4 py-3">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OrderTotalsPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Totals</h2>
      <Separator className="my-4" />
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatMoney(order.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Coupon discount</dt>
          <dd>{formatMoney(order.couponDiscount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd>{formatMoney(order.shippingPrice)}</dd>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(order.total)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function OrderPaymentPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Payment</h2>
        <PaymentStatusBadge status={order.payment?.status} />
      </div>
      <Separator className="my-4" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Method" value={order.payment?.method ?? "-"} />
        <DetailRow label="Amount" value={formatMoney(order.payment?.amount ?? null)} />
        <DetailRow
          label="Created"
          value={formatDateTime(order.payment?.createdAt)}
        />
      </dl>
    </section>
  );
}

export function OrderShipmentPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Shipment</h2>
      <Separator className="my-4" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow
          label="Tracking number"
          value={order.shipment?.trackingNumber ?? "-"}
        />
        <DetailRow
          label="Shipped"
          value={formatDateTime(order.shipment?.shippedAt)}
        />
        <DetailRow
          label="Delivered"
          value={formatDateTime(order.shipment?.deliveredAt)}
        />
      </dl>
    </section>
  );
}

export function OrderStatusHistoryPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Status history</h2>
      <Separator className="my-4" />
      <div className="space-y-3">
        {order.statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status history.</p>
        ) : (
          order.statusHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <Badge variant="outline">{item.status ?? "Unknown"}</Badge>
              <span className="text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
