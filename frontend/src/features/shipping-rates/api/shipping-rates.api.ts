import { request } from "@/shared/api/client";
import type {
  ShippingRate,
  ShippingRateListParams,
  ShippingRateMutationPayload,
} from "../types/shipping-rate";

function buildShippingRateSearchParams(params: ShippingRateListParams) {
  const search = new URLSearchParams();
  if (params.isActive !== undefined) {
    search.set("isActive", String(params.isActive));
  }
  return search;
}

export const shippingRatesApi = {
  list(params: ShippingRateListParams, signal?: AbortSignal) {
    const search = buildShippingRateSearchParams(params);
    const query = search.size > 0 ? `?${search}` : "";
    return request<ShippingRate[]>(`/admin/shipping-rates${query}`, { signal });
  },
  detail(id: string, signal?: AbortSignal) {
    return request<ShippingRate>(`/admin/shipping-rates/${id}`, { signal });
  },
  create(payload: ShippingRateMutationPayload) {
    return request<ShippingRate>("/admin/shipping-rates", {
      method: "POST",
      body: payload,
    });
  },
  update(id: string, payload: ShippingRateMutationPayload) {
    return request<ShippingRate>(`/admin/shipping-rates/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  delete(id: string) {
    return request<{ id: string }>(`/admin/shipping-rates/${id}`, {
      method: "DELETE",
    });
  },
};
