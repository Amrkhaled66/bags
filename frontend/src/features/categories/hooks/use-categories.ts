import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import type { CategoryMutationPayload } from "../types/category";

export const categoryQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryQueryKeys.all, "list"] as const,
  list: () => [...categoryQueryKeys.lists()] as const,
  details: () => [...categoryQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryQueryKeys.details(), id] as const,
};

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: ({ signal }) => categoriesApi.list(signal),
  });
}

export function useCategory(id?: string) {
  return useQuery({
    queryKey: id ? categoryQueryKeys.detail(id) : categoryQueryKeys.details(),
    queryFn: ({ signal }) => categoriesApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useCategorySelectorOptions() {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: ({ signal }) => categoriesApi.list(signal),
    select: (categories) =>
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
      })),
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (payload: CategoryMutationPayload) => categoriesApi.create(payload),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CategoryMutationPayload>;
    }) => categoriesApi.update(id, payload),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => void invalidate(),
  });
}
