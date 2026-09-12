import { request } from "@/shared/api/client";
import type { Paginated } from "@/shared/types/api";
import type {
  Product,
  ProductInventoryPayload,
  ProductListParams,
  ProductMutationPayload,
  ProductVariant,
  ProductVariantMutationPayload,
} from "../types/product";

function buildProductSearchParams(params: ProductListParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 10));
  if (params.search) search.set("search", params.search);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  if (params.status) search.set("status", params.status);
  if (params.brandId) search.set("brandId", params.brandId);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.isFeatured !== undefined)
    search.set("isFeatured", String(params.isFeatured));
  if (params.isNewArrival !== undefined)
    search.set("isNewArrival", String(params.isNewArrival));
  return search;
}

export const productsApi = {
  list(params: ProductListParams, signal?: AbortSignal) {
    return request<Paginated<Product>>(
      `/admin/products?${buildProductSearchParams(params)}`,
      { signal },
    );
  },
  detail(id: string, signal?: AbortSignal) {
    return request<Product>(`/admin/products/${id}`, { signal });
  },
  create(payload: ProductMutationPayload) {
    return request<Product>("/admin/products", { method: "POST", body: payload });
  },
  update(id: string, payload: ProductMutationPayload) {
    return request<Product>(`/admin/products/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  delete(id: string) {
    return request<{ id: string }>(`/admin/products/${id}`, {
      method: "DELETE",
    });
  },
  listVariants(productId: string, signal?: AbortSignal) {
    return request<ProductVariant[]>(`/admin/products/${productId}/variants`, {
      signal,
    });
  },
  createVariant(productId: string, payload: ProductVariantMutationPayload) {
    return request<ProductVariant>(`/admin/products/${productId}/variants`, {
      method: "POST",
      body: payload,
    });
  },
  updateVariant(
    productId: string,
    variantId: string,
    payload: Partial<ProductVariantMutationPayload>,
  ) {
    return request<ProductVariant>(
      `/admin/products/${productId}/variants/${variantId}`,
      { method: "PATCH", body: payload },
    );
  },
  updateInventory(
    productId: string,
    variantId: string,
    payload: ProductInventoryPayload,
  ) {
    return request<ProductVariant>(
      `/admin/products/${productId}/variants/${variantId}/inventory`,
      { method: "PATCH", body: payload },
    );
  },
  replaceVariantImages(
    productId: string,
    variantId: string,
    imageUrls: string[],
  ) {
    return request<{ images: ProductVariant["images"]; imageUrl: string | null }>(
      `/admin/products/${productId}/variants/${variantId}/images`,
      { method: "PUT", body: { imageUrls } },
    );
  },
  deleteVariant(productId: string, variantId: string) {
    return request<{ id: string }>(
      `/admin/products/${productId}/variants/${variantId}`,
      { method: "DELETE" },
    );
  },
};
