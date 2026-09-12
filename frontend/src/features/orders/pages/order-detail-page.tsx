import { useParams } from "react-router";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { ErrorState, LoadingState } from "@/shared/components/request-state";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/utils/format";
import { OrderActionsPanel } from "../components/order-actions-panel";
import {
  OrderAddressPanel,
  OrderCustomerPanel,
  OrderItemsPanel,
  OrderPaymentPanel,
  OrderShipmentPanel,
  OrderStatusHistoryPanel,
  OrderTotalsPanel,
} from "../components/order-detail-panels";
import { OrderStatusBadge } from "../components/order-status-badge";
import {
  useAdminOrder,
  useUpdateOrderPayment,
  useUpdateOrderShipment,
  useUpdateOrderStatus,
} from "../hooks/use-orders";
import type {
  OrderStatus,
  UpdatePaymentStatusPayload,
  UpdateShipmentPayload,
} from "../types/order";

export default function OrderDetailPage() {
  const { id } = useParams();
  const query = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateShipment = useUpdateOrderShipment();
  const updatePayment = useUpdateOrderPayment();
  const mutationError =
    updateStatus.error ?? updateShipment.error ?? updatePayment.error ?? null;
  const mutationPending =
    updateStatus.isPending || updateShipment.isPending || updatePayment.isPending;

  async function submitStatus(status: OrderStatus) {
    if (!id) return;
    await updateStatus.mutateAsync({ id, payload: { status } });
  }

  async function submitPayment(payload: UpdatePaymentStatusPayload) {
    if (!id) return;
    await updatePayment.mutateAsync({ id, payload });
  }

  async function submitShipment(payload: UpdateShipmentPayload) {
    if (!id) return;
    await updateShipment.mutateAsync({ id, payload });
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={query.data?.orderNumber ?? "Order details"}
        description={`Created ${formatDateTime(query.data?.createdAt)}`}
        isRefreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        backTo="/admin/orders"
        backLabel="Orders"
        badges={query.data ? (
          <>
            <OrderStatusBadge status={query.data.status} />
            {query.data?.customerId ? (
              <Badge variant="outline">Customer</Badge>
            ) : (
              <Badge variant="outline">Guest</Badge>
            )}
          </>
        ) : null}
      />

      {query.isPending ? (
        <LoadingState label="Loading order..." />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            <OrderItemsPanel order={query.data} />
            <div className="grid gap-5 lg:grid-cols-2">
              <OrderCustomerPanel order={query.data} />
              <OrderAddressPanel order={query.data} />
            </div>
            <OrderStatusHistoryPanel order={query.data} />
          </div>
          <div className="space-y-5">
            <OrderActionsPanel
              order={query.data}
              pending={mutationPending}
              error={mutationError}
              onUpdateStatus={submitStatus}
              onUpdatePayment={submitPayment}
              onUpdateShipment={submitShipment}
            />
            <OrderTotalsPanel order={query.data} />
            <OrderPaymentPanel order={query.data} />
            <OrderShipmentPanel order={query.data} />
          </div>
        </div>
      )}
    </div>
  );
}
