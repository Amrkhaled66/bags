import { request } from "@/shared/api/client";
import type { Paginated } from "@/shared/types/api";
import type {
  Order,
  OrderDetail,
  OrderListParams,
  UpdateOrderStatusPayload,
  UpdatePaymentStatusPayload,
  UpdateShipmentPayload,
} from "../types/order";

function buildOrderSearchParams(params: OrderListParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  if (params.search) search.set("search", params.search);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  if (params.status) search.set("status", params.status);
  if (params.customerId) search.set("customerId", params.customerId);
  if (params.governorate) search.set("governorate", params.governorate);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  return search;
}

export const ordersApi = {
  list(params: OrderListParams, signal?: AbortSignal) {
    return request<Paginated<Order>>(
      `/admin/orders?${buildOrderSearchParams(params)}`,
      { signal },
    );
  },
  detail(id: string, signal?: AbortSignal) {
    return request<OrderDetail>(`/admin/orders/${id}`, { signal });
  },
  updateStatus(id: string, payload: UpdateOrderStatusPayload) {
    return request<OrderDetail>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: payload,
    });
  },
  updateShipment(id: string, payload: UpdateShipmentPayload) {
    return request<OrderDetail>(`/admin/orders/${id}/shipment`, {
      method: "PATCH",
      body: payload,
    });
  },
  updatePayment(id: string, payload: UpdatePaymentStatusPayload) {
    return request<OrderDetail>(`/admin/orders/${id}/payment`, {
      method: "PATCH",
      body: payload,
    });
  },
};
