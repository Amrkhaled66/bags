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
import { ShippingRateFormSheet } from "../components/shipping-rate-form-sheet";
import { ShippingRatesTable } from "../components/shipping-rates-table";
import { ShippingRatesToolbar } from "../components/shipping-rates-toolbar";
import {
  useAdminShippingRates,
  useCreateShippingRate,
  useDeleteShippingRate,
  useUpdateShippingRate,
} from "../hooks/use-shipping-rates";
import type {
  ShippingRate,
  ShippingRateListParams,
  ShippingRateMutationPayload,
} from "../types/shipping-rate";

const pageSize = 10;

function parseShippingRateParams(
  params: URLSearchParams,
): ShippingRateListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    isActive: parseBooleanParam(params.get("isActive")),
    sortBy:
      sortBy === "shippingPrice" || sortBy === "governorate"
        ? sortBy
        : "governorate",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "asc",
  };
}

function applyShippingRateParams(
  shippingRates: ShippingRate[],
  params: ShippingRateListParams,
) {
  const search = params.search?.trim().toLowerCase();
  const filtered = search
    ? shippingRates.filter((shippingRate) =>
        shippingRate.governorate.toLowerCase().includes(search),
      )
    : shippingRates;
  const sorted = filtered.toSorted((left, right) => {
    const direction = params.sortOrder === "desc" ? -1 : 1;
    if (params.sortBy === "shippingPrice") {
      return (
        (Number(left.shippingPrice) - Number(right.shippingPrice)) * direction
      );
    }
    return left.governorate.localeCompare(right.governorate) * direction;
  });
  const total = sorted.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(params.page ?? 1, totalPages);
  const start = (page - 1) * pageSize;
  return {
    data: sorted.slice(start, start + pageSize),
    meta: { page, limit: pageSize, total, totalPages },
  };
}

function toStatusPayload(shippingRate: ShippingRate, isActive: boolean) {
  return {
    governorate: shippingRate.governorate,
    shippingPrice: shippingRate.shippingPrice,
    freeShippingThreshold: shippingRate.freeShippingThreshold,
    isActive,
  };
}

export default function ShippingRatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(
    () => parseShippingRateParams(searchParams),
    [searchParams],
  );
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const [editingShippingRate, setEditingShippingRate] =
    useState<ShippingRate | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteShippingRate, setDeleteShippingRate] =
    useState<ShippingRate | null>(null);
  const [deactivateShippingRate, setDeactivateShippingRate] =
    useState<ShippingRate | null>(null);
  const [pendingShippingRateId, setPendingShippingRateId] =
    useState<string | null>(null);
  const shippingRatesQuery = useAdminShippingRates({
    isActive: params.isActive,
  });
  const createShippingRate = useCreateShippingRate();
  const updateShippingRate = useUpdateShippingRate();
  const removeShippingRate = useDeleteShippingRate();
  const result = useMemo(
    () => applyShippingRateParams(shippingRatesQuery.data ?? [], params),
    [params, shippingRatesQuery.data],
  );

  function writeParams(next: Partial<ShippingRateListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "isActive", merged.isActive);
    writeSearchParam(output, "sortBy", merged.sortBy, "governorate");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "asc");
    setSearchParams(output);
  }

  async function submitShippingRate(payload: ShippingRateMutationPayload) {
    if (editingShippingRate) {
      return updateShippingRate.mutateAsync({
        id: editingShippingRate.id,
        payload,
      });
    }
    return createShippingRate.mutateAsync(payload);
  }

  async function updateStatus(shippingRate: ShippingRate, isActive: boolean) {
    setPendingShippingRateId(shippingRate.id);
    try {
      await updateShippingRate.mutateAsync({
        id: shippingRate.id,
        payload: toStatusPayload(shippingRate, isActive),
      });
      setDeactivateShippingRate(null);
    } finally {
      setPendingShippingRateId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteShippingRate) return;
    setPendingShippingRateId(deleteShippingRate.id);
    try {
      await removeShippingRate.mutateAsync(deleteShippingRate.id);
      setDeleteShippingRate(null);
    } finally {
      setPendingShippingRateId(null);
    }
  }

  const mutationError =
    updateShippingRate.error ??
    createShippingRate.error ??
    removeShippingRate.error ??
    null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Shipping rates"
        description="Manage delivery availability, pricing, and free shipping thresholds."
        isRefreshing={shippingRatesQuery.isFetching}
        onRefresh={() => void shippingRatesQuery.refetch()}
        createLabel="Create rate"
        onCreate={() => {
          setEditingShippingRate(null);
          setSheetOpen(true);
        }}
      />

      <ActionErrorAlert error={mutationError} />

      <section className="overflow-hidden rounded-md border bg-background">
        <ShippingRatesToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={shippingRatesQuery.isFetching}
          onDraftSearchChange={setDraftSearch}
          onSearchSubmit={() =>
            writeParams({ search: draftSearch.trim() || undefined, page: 1 })
          }
          onFilterChange={(next) => writeParams({ ...next, page: 1 })}
          onReset={() => {
            setDraftSearch("");
            setSearchParams({});
          }}
        />
        {shippingRatesQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={shippingRatesQuery.error}
              retry={() => void shippingRatesQuery.refetch()}
            />
          </div>
        ) : result.data.length === 0 && !shippingRatesQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No shipping rates found"
              description="Create a rate or change the current filters."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setEditingShippingRate(null);
                    setSheetOpen(true);
                  }}
                >
                  Create rate
                </Button>
              }
            />
          </div>
        ) : (
          <ShippingRatesTable
            shippingRates={result.data}
            loading={shippingRatesQuery.isPending}
            pendingShippingRateId={pendingShippingRateId}
            onEdit={(shippingRate) => {
              setEditingShippingRate(shippingRate);
              setSheetOpen(true);
            }}
            onActivate={(shippingRate) => void updateStatus(shippingRate, true)}
            onDeactivate={setDeactivateShippingRate}
            onDelete={setDeleteShippingRate}
          />
        )}
        {result.meta.total > 0 && (
          <PaginationControls
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            total={result.meta.total}
            pageSize={result.meta.limit}
            isPending={shippingRatesQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>

      <ShippingRateFormSheet
        open={sheetOpen}
        shippingRate={editingShippingRate}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingShippingRate(null);
        }}
        onSubmitShippingRate={submitShippingRate}
      />

      <ConfirmActionDialog
        open={!!deactivateShippingRate}
        onOpenChange={(open) => !open && setDeactivateShippingRate(null)}
        title="Deactivate shipping rate?"
        description="Customers will not be able to check out to this governorate until the rate is active again."
        actionLabel="Deactivate"
        onConfirm={() =>
          deactivateShippingRate &&
          void updateStatus(deactivateShippingRate, false)
        }
      />

      <ConfirmActionDialog
        open={!!deleteShippingRate}
        onOpenChange={(open) => !open && setDeleteShippingRate(null)}
        title="Delete shipping rate?"
        description="This removes the delivery option for this governorate. Existing orders keep their saved shipping snapshot."
        actionLabel="Delete rate"
        actionVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
