import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brandsApi } from "../api/brands.api";
import type { BrandListParams, BrandMutationPayload } from "../types/brand";

export const brandQueryKeys = {
  all: ["brands"] as const,
  lists: () => [...brandQueryKeys.all, "list"] as const,
  list: (params: BrandListParams) => [...brandQueryKeys.lists(), params] as const,
  details: () => [...brandQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...brandQueryKeys.details(), id] as const,
};

function useInvalidateBrands() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: brandQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminBrands(params: BrandListParams) {
  return useQuery({
    queryKey: brandQueryKeys.list(params),
    queryFn: ({ signal }) => brandsApi.list(params, signal),
  });
}

export function useAdminBrand(id?: string) {
  return useQuery({
    queryKey: id ? brandQueryKeys.detail(id) : brandQueryKeys.details(),
    queryFn: ({ signal }) => brandsApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useBrandSelectorOptions(search = "") {
  return useQuery({
    queryKey: brandQueryKeys.list({ search, isActive: true, limit: 100 }),
    queryFn: ({ signal }) =>
      brandsApi.list({ search, isActive: true, limit: 100, sortBy: "name", sortOrder: "asc" }, signal),
    select: (response) =>
      response.data.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
      })),
  });
}

export function useCreateBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (payload: BrandMutationPayload) => brandsApi.create(payload),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BrandMutationPayload }) =>
      brandsApi.update(id, payload),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => void invalidate(),
  });
}
