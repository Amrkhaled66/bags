import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponsApi } from "../api/coupons.api";
import type { CouponListParams, CouponMutationPayload } from "../types/coupon";

export const couponQueryKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponQueryKeys.all, "list"] as const,
  list: (params: CouponListParams) =>
    [...couponQueryKeys.lists(), params] as const,
  details: () => [...couponQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...couponQueryKeys.details(), id] as const,
};

function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminCoupons(params: CouponListParams) {
  return useQuery({
    queryKey: couponQueryKeys.list(params),
    queryFn: ({ signal }) => couponsApi.list(params, signal),
  });
}

export function useAdminCoupon(id?: string) {
  return useQuery({
    queryKey: id ? couponQueryKeys.detail(id) : couponQueryKeys.details(),
    queryFn: ({ signal }) => couponsApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (payload: CouponMutationPayload) => couponsApi.create(payload),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CouponMutationPayload;
    }) => couponsApi.update(id, payload),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => void invalidate(),
  });
}
