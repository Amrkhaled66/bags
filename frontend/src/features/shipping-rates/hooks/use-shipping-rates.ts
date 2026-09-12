import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shippingRatesApi } from "../api/shipping-rates.api";
import type {
  ShippingRateListParams,
  ShippingRateMutationPayload,
} from "../types/shipping-rate";

export const shippingRateQueryKeys = {
  all: ["shipping-rates"] as const,
  lists: () => [...shippingRateQueryKeys.all, "list"] as const,
  list: (params: ShippingRateListParams) =>
    [...shippingRateQueryKeys.lists(), params] as const,
  details: () => [...shippingRateQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...shippingRateQueryKeys.details(), id] as const,
};

function useInvalidateShippingRates() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: shippingRateQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminShippingRates(params: ShippingRateListParams) {
  return useQuery({
    queryKey: shippingRateQueryKeys.list(params),
    queryFn: ({ signal }) => shippingRatesApi.list(params, signal),
  });
}

export function useAdminShippingRate(id?: string) {
  return useQuery({
    queryKey: id
      ? shippingRateQueryKeys.detail(id)
      : shippingRateQueryKeys.details(),
    queryFn: ({ signal }) => shippingRatesApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useCreateShippingRate() {
  const invalidate = useInvalidateShippingRates();
  return useMutation({
    mutationFn: (payload: ShippingRateMutationPayload) =>
      shippingRatesApi.create(payload),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateShippingRate() {
  const invalidate = useInvalidateShippingRates();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ShippingRateMutationPayload;
    }) => shippingRatesApi.update(id, payload),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteShippingRate() {
  const invalidate = useInvalidateShippingRates();
  return useMutation({
    mutationFn: (id: string) => shippingRatesApi.delete(id),
    onSuccess: () => void invalidate(),
  });
}
