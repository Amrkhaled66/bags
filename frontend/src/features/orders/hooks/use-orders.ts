import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type {
  OrderListParams,
  UpdateOrderStatusPayload,
  UpdatePaymentStatusPayload,
  UpdateShipmentPayload,
} from "../types/order";

export const orderQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...orderQueryKeys.all, "list"] as const,
  list: (params: OrderListParams) => [...orderQueryKeys.lists(), params] as const,
  details: () => [...orderQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...orderQueryKeys.details(), id] as const,
};

function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return (id?: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: id ? orderQueryKeys.detail(id) : orderQueryKeys.details(),
      }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderQueryKeys.list(params),
    queryFn: ({ signal }) => ordersApi.list(params, signal),
  });
}

export function useAdminOrder(id?: string) {
  return useQuery({
    queryKey: id ? orderQueryKeys.detail(id) : orderQueryKeys.details(),
    queryFn: ({ signal }) => ordersApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderStatusPayload }) =>
      ordersApi.updateStatus(id, payload),
    onSuccess: (_order, variables) => void invalidate(variables.id),
  });
}

export function useUpdateOrderShipment() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShipmentPayload }) =>
      ordersApi.updateShipment(id, payload),
    onSuccess: (_order, variables) => void invalidate(variables.id),
  });
}

export function useUpdateOrderPayment() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePaymentStatusPayload;
    }) => ordersApi.updatePayment(id, payload),
    onSuccess: (_order, variables) => void invalidate(variables.id),
  });
}
