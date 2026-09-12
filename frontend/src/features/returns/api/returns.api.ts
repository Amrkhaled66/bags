import { request } from "@/shared/api/client";
import type { Paginated } from "@/shared/types/api";
import type {
  CompleteRefundPayload,
  ReturnDetail,
  ReturnListParams,
  ReturnRequest,
  UpdateReturnStatusPayload,
} from "../types/return";

function buildReturnSearchParams(params: ReturnListParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  if (params.search) search.set("search", params.search);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  if (params.status) search.set("status", params.status);
  if (params.orderId) search.set("orderId", params.orderId);
  if (params.customerId) search.set("customerId", params.customerId);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  return search;
}

export const returnsApi = {
  list(params: ReturnListParams, signal?: AbortSignal) {
    return request<Paginated<ReturnRequest>>(
      `/admin/returns?${buildReturnSearchParams(params)}`,
      { signal },
    );
  },
  detail(id: string, signal?: AbortSignal) {
    return request<ReturnDetail>(`/admin/returns/${id}`, { signal });
  },
  updateStatus(id: string, payload: UpdateReturnStatusPayload) {
    return request<ReturnDetail>(`/admin/returns/${id}/status`, {
      method: "PATCH",
      body: payload,
    });
  },
  completeRefund(id: string, payload: CompleteRefundPayload) {
    return request<ReturnDetail>(`/admin/returns/${id}/refund`, {
      method: "POST",
      body: payload,
    });
  },
};
