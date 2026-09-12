import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products.api";
import type {
  ProductInventoryPayload,
  ProductListParams,
  ProductMutationPayload,
  ProductVariantMutationPayload,
} from "../types/product";

export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productQueryKeys.lists(), params] as const,
  details: () => [...productQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  variants: (productId: string) =>
    [...productQueryKeys.detail(productId), "variants"] as const,
};

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productQueryKeys.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
  });
}

export function useAdminProduct(id?: string) {
  return useQuery({
    queryKey: id ? productQueryKeys.detail(id) : productQueryKeys.details(),
    queryFn: ({ signal }) => productsApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (payload: ProductMutationPayload) => productsApi.create(payload),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProductMutationPayload;
    }) => productsApi.update(id, payload),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => void invalidate(),
  });
}

export function useProductVariants(productId?: string) {
  return useQuery({
    queryKey: productId
      ? productQueryKeys.variants(productId)
      : [...productQueryKeys.details(), "variants"],
    queryFn: ({ signal }) => productsApi.listVariants(productId ?? "", signal),
    enabled: !!productId,
  });
}

export function useCreateProductVariant(productId: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductVariantMutationPayload) =>
      productsApi.createVariant(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.variants(productId),
      });
      void invalidate();
    },
  });
}

export function useUpdateProductVariant(productId: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: Partial<ProductVariantMutationPayload>;
    }) => productsApi.updateVariant(productId, variantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.variants(productId),
      });
      void invalidate();
    },
  });
}

export function useUpdateProductInventory(productId: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: ProductInventoryPayload;
    }) => productsApi.updateInventory(productId, variantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.variants(productId),
      });
      void invalidate();
    },
  });
}

export function useReplaceVariantImages(productId: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      imageUrls,
    }: {
      variantId: string;
      imageUrls: string[];
    }) => productsApi.replaceVariantImages(productId, variantId, imageUrls),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.variants(productId),
      });
      void invalidate();
    },
  });
}

export function useDeleteProductVariant(productId: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      productsApi.deleteVariant(productId, variantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.variants(productId),
      });
      void invalidate();
    },
  });
}
