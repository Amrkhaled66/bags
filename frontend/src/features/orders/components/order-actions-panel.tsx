import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { getErrorMessage } from "@/shared/utils/error-message";
import {
  paymentStatusSchema,
  shipmentFormSchema,
  type ShipmentFormValues,
} from "../schemas/order.schema";
import type {
  OrderDetail,
  OrderStatus,
  PaymentStatus,
  UpdatePaymentStatusPayload,
  UpdateShipmentPayload,
} from "../types/order";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

export function OrderActionsPanel({
  order,
  pending,
  error,
  onUpdateStatus,
  onUpdatePayment,
  onUpdateShipment,
}: {
  order: OrderDetail;
  pending?: boolean;
  error?: unknown;
  onUpdateStatus: (status: OrderStatus) => Promise<void>;
  onUpdatePayment: (payload: UpdatePaymentStatusPayload) => Promise<void>;
  onUpdateShipment: (payload: UpdateShipmentPayload) => Promise<void>;
}) {
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const shipmentForm = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      trackingNumber: order.shipment?.trackingNumber ?? "",
    },
  });
  const availableTransitions = order.status
    ? allowedTransitions[order.status]
    : [];
  const canEditShipment =
    order.status === "confirmed" || order.status === "shipped";

  async function submitPayment() {
    if (!paymentStatus) return;
    const parsed = paymentStatusSchema.safeParse(paymentStatus);
    if (!parsed.success) return;
    await onUpdatePayment({ status: parsed.data });
    setPaymentStatus("");
  }

  async function submitShipment(values: ShipmentFormValues) {
    await onUpdateShipment({ trackingNumber: values.trackingNumber.trim() });
    shipmentForm.reset({ trackingNumber: values.trackingNumber.trim() });
  }

  return (
    <section className="rounded-md border bg-background p-5">
      <h2 className="text-base font-semibold">Actions</h2>
      <Separator className="my-4" />
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <Label>Order status</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Move the order through the backend-supported status flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No status changes are available.
              </p>
            ) : (
              availableTransitions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={status === "cancelled" ? "destructive" : "outline"}
                  disabled={pending}
                  onClick={() => setNextStatus(status)}
                >
                  {orderStatusLabels[status]}
                </Button>
              ))
            )}
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div>
            <Label htmlFor="order-payment-status">Payment status</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Record the current payment state. This does not transfer money.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={paymentStatus}
              disabled={pending}
              onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
            >
              <SelectTrigger id="order-payment-status" className="w-52">
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusSchema.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {paymentStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              disabled={pending || !paymentStatus}
              onClick={() => void submitPayment()}
            >
              {pending && <LoaderCircle className="animate-spin" />}
              Update payment
            </Button>
          </div>
        </div>
        <Separator />
        <form
          className="space-y-3"
          onSubmit={shipmentForm.handleSubmit((values) =>
            void submitShipment(values),
          )}
        >
          <div>
            <Label htmlFor="order-tracking-number">Tracking number</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Tracking can be updated after the order is confirmed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              id="order-tracking-number"
              className="max-w-sm"
              disabled={pending || !canEditShipment}
              aria-invalid={!!shipmentForm.formState.errors.trackingNumber}
              {...shipmentForm.register("trackingNumber")}
            />
            <Button type="submit" disabled={pending || !canEditShipment}>
              {pending && <LoaderCircle className="animate-spin" />}
              Save tracking
            </Button>
          </div>
          {shipmentForm.formState.errors.trackingNumber && (
            <p className="text-sm text-destructive">
              {shipmentForm.formState.errors.trackingNumber.message}
            </p>
          )}
        </form>
      </div>

      <AlertDialog
        open={!!nextStatus}
        onOpenChange={(open) => !open && setNextStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update order status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move {order.orderNumber} to{" "}
              {nextStatus ? orderStatusLabels[nextStatus] : "the selected status"}.
              Inventory, payment, and shipment side effects are handled by the
              backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!nextStatus) return;
                void onUpdateStatus(nextStatus).then(() => setNextStatus(null));
              }}
            >
              Update status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
