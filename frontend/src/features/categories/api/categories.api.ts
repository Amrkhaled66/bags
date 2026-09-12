import { request } from "@/shared/api/client";
import type { Category, CategoryMutationPayload } from "../types/category";

export const categoriesApi = {
  list(signal?: AbortSignal) {
    return request<Category[]>("/categories", { signal });
  },
  detail(id: string, signal?: AbortSignal) {
    return request<Category>(`/categories/${id}`, { signal });
  },
  create(payload: CategoryMutationPayload) {
    return request<Category>("/categories", { method: "POST", body: payload });
  },
  update(id: string, payload: Partial<CategoryMutationPayload>) {
    return request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  delete(id: string) {
    return request<{ id: string }>(`/categories/${id}`, { method: "DELETE" });
  },
};
