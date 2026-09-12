import { useParams } from "react-router";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { ErrorState, LoadingState } from "@/shared/components/request-state";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/utils/format";
import { ReturnActionsPanel } from "../components/return-actions-panel";
import {
  RefundsPanel,
  ReturnItemsPanel,
  ReturnSummaryPanel,
} from "../components/return-detail-panels";
import { ReturnStatusBadge } from "../components/return-status-badge";
import {
  useAdminReturn,
  useCompleteReturnRefund,
  useUpdateReturnStatus,
} from "../hooks/use-returns";
import type {
  CompleteRefundPayload,
  UpdateReturnStatusPayload,
} from "../types/return";

export default function ReturnDetailPage() {
  const { id } = useParams();
  const query = useAdminReturn(id);
  const updateStatus = useUpdateReturnStatus();
  const completeRefund = useCompleteReturnRefund();
  const mutationError = updateStatus.error ?? completeRefund.error ?? null;
  const mutationPending = updateStatus.isPending || completeRefund.isPending;

  async function submitStatus(payload: UpdateReturnStatusPayload) {
    if (!id) return;
    await updateStatus.mutateAsync({ id, payload });
  }

  async function submitRefund(payload: CompleteRefundPayload) {
    if (!id) return;
    await completeRefund.mutateAsync({ id, payload });
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={query.data?.orderNumber ?? "Return details"}
        description={`Created ${formatDateTime(query.data?.createdAt)}`}
        isRefreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        backTo="/admin/returns"
        backLabel="Returns"
        badges={query.data ? (
          <>
            <ReturnStatusBadge status={query.data.status} />
            {query.data.customerId ? (
              <Badge variant="outline">Customer</Badge>
            ) : (
              <Badge variant="outline">Guest</Badge>
            )}
          </>
        ) : null}
      />

      {query.isPending ? (
        <LoadingState label="Loading return..." />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            <ReturnItemsPanel returnRequest={query.data} />
            <ReturnSummaryPanel returnRequest={query.data} />
          </div>
          <div className="space-y-5">
            <ReturnActionsPanel
              returnRequest={query.data}
              pending={mutationPending}
              error={mutationError}
              onUpdateStatus={submitStatus}
              onCompleteRefund={submitRefund}
            />
            <RefundsPanel returnRequest={query.data} />
          </div>
        </div>
      )}
    </div>
  );
}
