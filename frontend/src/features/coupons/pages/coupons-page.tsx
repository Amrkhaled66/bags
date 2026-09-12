import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { PaginationControls } from "@/shared/components/pagination-controls";
import { ErrorState } from "@/shared/components/request-state";
import { Button } from "@/shared/components/ui/button";
import {
  parseBooleanParam,
  parsePositiveIntParam,
  writeSearchParam,
} from "@/shared/utils/search-params";
import { CouponFormSheet } from "../components/coupon-form-sheet";
import { CouponsTable } from "../components/coupons-table";
import { CouponsToolbar } from "../components/coupons-toolbar";
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "../hooks/use-coupons";
import type {
  Coupon,
  CouponListParams,
  CouponMutationPayload,
} from "../types/coupon";

const pageSize = 10;

function parseCouponParams(params: URLSearchParams): CouponListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    isActive: parseBooleanParam(params.get("isActive")),
    sortBy:
      sortBy === "code" || sortBy === "expiresAt" || sortBy === "createdAt"
        ? sortBy
        : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
}

function toCouponPayload(coupon: Coupon, isActive: boolean): CouponMutationPayload {
  return {
    code: coupon.code,
    percentage: coupon.percentage,
    minimumOrder: coupon.minimumOrder,
    usageLimit: coupon.usageLimit,
    expiresAt: coupon.expiresAt,
    isActive,
  };
}

export default function CouponsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseCouponParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deactivateCoupon, setDeactivateCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [pendingCouponId, setPendingCouponId] = useState<string | null>(null);
  const couponsQuery = useAdminCoupons(params);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const removeCoupon = useDeleteCoupon();

  function writeParams(next: Partial<CouponListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "isActive", merged.isActive);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    setSearchParams(output);
  }

  async function submitCoupon(payload: CouponMutationPayload) {
    if (editingCoupon) {
      return updateCoupon.mutateAsync({ id: editingCoupon.id, payload });
    }
    return createCoupon.mutateAsync(payload);
  }

  async function updateStatus(coupon: Coupon, isActive: boolean) {
    setPendingCouponId(coupon.id);
    try {
      await updateCoupon.mutateAsync({
        id: coupon.id,
        payload: toCouponPayload(coupon, isActive),
      });
      setDeactivateCoupon(null);
    } finally {
      setPendingCouponId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteCoupon) return;
    setPendingCouponId(deleteCoupon.id);
    try {
      await removeCoupon.mutateAsync(deleteCoupon.id);
      setDeleteCoupon(null);
    } finally {
      setPendingCouponId(null);
    }
  }

  const mutationError =
    updateCoupon.error ?? createCoupon.error ?? removeCoupon.error ?? null;
  const coupons = couponsQuery.data?.data ?? [];
  const meta = couponsQuery.data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Coupons"
        description="Manage discount codes, usage limits, expiration, and checkout availability."
        isRefreshing={couponsQuery.isFetching}
        onRefresh={() => void couponsQuery.refetch()}
        createLabel="Create coupon"
        onCreate={() => {
          setEditingCoupon(null);
          setSheetOpen(true);
        }}
      />

      <ActionErrorAlert error={mutationError} />

      <section className="overflow-hidden rounded-md border bg-background">
        <CouponsToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={couponsQuery.isFetching}
          onDraftSearchChange={setDraftSearch}
          onSearchSubmit={() =>
            writeParams({
              search: draftSearch.trim().toUpperCase() || undefined,
              page: 1,
            })
          }
          onFilterChange={(next) => writeParams({ ...next, page: 1 })}
          onReset={() => {
            setDraftSearch("");
            setSearchParams({});
          }}
        />
        {couponsQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={couponsQuery.error}
              retry={() => void couponsQuery.refetch()}
            />
          </div>
        ) : coupons.length === 0 && !couponsQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No coupons found"
              description="Create a coupon or change the current filters."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setEditingCoupon(null);
                    setSheetOpen(true);
                  }}
                >
                  Create coupon
                </Button>
              }
            />
          </div>
        ) : (
          <CouponsTable
            coupons={coupons}
            loading={couponsQuery.isPending}
            pendingCouponId={pendingCouponId}
            onEdit={(coupon) => {
              setEditingCoupon(coupon);
              setSheetOpen(true);
            }}
            onActivate={(coupon) => void updateStatus(coupon, true)}
            onDeactivate={setDeactivateCoupon}
            onDelete={setDeleteCoupon}
          />
        )}
        {meta && meta.total > 0 && (
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            isPending={couponsQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>

      <CouponFormSheet
        open={sheetOpen}
        coupon={editingCoupon}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingCoupon(null);
        }}
        onSubmitCoupon={submitCoupon}
      />

      <ConfirmActionDialog
        open={!!deactivateCoupon}
        onOpenChange={(open) => !open && setDeactivateCoupon(null)}
        title="Deactivate coupon?"
        description={`${deactivateCoupon?.code ?? "This coupon"} will no longer be accepted during checkout.`}
        actionLabel="Deactivate"
        onConfirm={() =>
          deactivateCoupon && void updateStatus(deactivateCoupon, false)
        }
      />

      <ConfirmActionDialog
        open={!!deleteCoupon}
        onOpenChange={(open) => !open && setDeleteCoupon(null)}
        title="Delete coupon?"
        description="This removes the coupon from future checkout use. Existing orders keep their saved discount values."
        actionLabel="Delete coupon"
        actionVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
