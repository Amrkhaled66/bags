import { request } from "@/shared/api/client";
import type { Paginated } from "@/shared/types/api";
import type {
  Coupon,
  CouponListParams,
  CouponMutationPayload,
} from "../types/coupon";

function buildCouponSearchParams(params: CouponListParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  if (params.search) search.set("search", params.search);
  if (params.isActive !== undefined) {
    search.set("isActive", String(params.isActive));
  }
  if (params.code) search.set("code", params.code);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  return search;
}

export const couponsApi = {
  list(params: CouponListParams, signal?: AbortSignal) {
    return request<Paginated<Coupon>>(
      `/admin/coupons?${buildCouponSearchParams(params)}`,
      { signal },
    );
  },
  detail(id: string, signal?: AbortSignal) {
    return request<Coupon>(`/admin/coupons/${id}`, { signal });
  },
  create(payload: CouponMutationPayload) {
    return request<Coupon>("/admin/coupons", { method: "POST", body: payload });
  },
  update(id: string, payload: CouponMutationPayload) {
    return request<Coupon>(`/admin/coupons/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  delete(id: string) {
    return request<{ id: string }>(`/admin/coupons/${id}`, {
      method: "DELETE",
    });
  },
};
