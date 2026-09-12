import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { returnsApi } from "../api/returns.api";
import type {
  CompleteRefundPayload,
  ReturnListParams,
  UpdateReturnStatusPayload,
} from "../types/return";

export const returnQueryKeys = {
  all: ["returns"] as const,
  lists: () => [...returnQueryKeys.all, "list"] as const,
  list: (params: ReturnListParams) => [...returnQueryKeys.lists(), params] as const,
  details: () => [...returnQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...returnQueryKeys.details(), id] as const,
};

function useInvalidateReturns() {
  const queryClient = useQueryClient();
  return (id?: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: returnQueryKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: id ? returnQueryKeys.detail(id) : returnQueryKeys.details(),
      }),
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] }),
    ]);
}

export function useAdminReturns(params: ReturnListParams) {
  return useQuery({
    queryKey: returnQueryKeys.list(params),
    queryFn: ({ signal }) => returnsApi.list(params, signal),
  });
}

export function useAdminReturn(id?: string) {
  return useQuery({
    queryKey: id ? returnQueryKeys.detail(id) : returnQueryKeys.details(),
    queryFn: ({ signal }) => returnsApi.detail(id ?? "", signal),
    enabled: !!id,
  });
}

export function useUpdateReturnStatus() {
  const invalidate = useInvalidateReturns();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateReturnStatusPayload;
    }) => returnsApi.updateStatus(id, payload),
    onSuccess: (_returnRequest, variables) => void invalidate(variables.id),
  });
}

export function useCompleteReturnRefund() {
  const invalidate = useInvalidateReturns();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CompleteRefundPayload;
    }) => returnsApi.completeRefund(id, payload),
    onSuccess: (_returnRequest, variables) => void invalidate(variables.id),
  });
}
