import { request } from "@/shared/api/client";
import type { Paginated } from "@/shared/types/api";
import type { Brand, BrandListParams, BrandMutationPayload } from "../types/brand";

function buildBrandSearchParams(params: BrandListParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  if (params.search) search.set("search", params.search);
  if (params.isActive !== undefined) search.set("isActive", String(params.isActive));
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  return search;
}

export const brandsApi = {
  list(params: BrandListParams, signal?: AbortSignal) {
    return request<Paginated<Brand>>(`/admin/brands?${buildBrandSearchParams(params)}`, {
      signal,
    });
  },
  detail(id: string, signal?: AbortSignal) {
    return request<Brand>(`/admin/brands/${id}`, { signal });
  },
  create(payload: BrandMutationPayload) {
    return request<Brand>("/admin/brands", { method: "POST", body: payload });
  },
  update(id: string, payload: BrandMutationPayload) {
    return request<Brand>(`/admin/brands/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  delete(id: string) {
    return request<void>(`/admin/brands/${id}`, { method: "DELETE" });
  },
};
