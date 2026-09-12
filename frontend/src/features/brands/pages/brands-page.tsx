import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/request-state";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { PaginationControls } from "@/shared/components/pagination-controls";
import {
  parseBooleanParam,
  parsePositiveIntParam,
  writeSearchParam,
} from "@/shared/utils/search-params";
import { BrandFormSheet } from "../components/brand-form-sheet";
import { BrandsTable } from "../components/brands-table";
import { BrandsToolbar } from "../components/brands-toolbar";
import {
  useAdminBrands,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "../hooks/use-brands";
import type { Brand, BrandListParams, BrandMutationPayload } from "../types/brand";

const pageSize = 10;

function parseBrandParams(params: URLSearchParams): BrandListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    isActive: parseBooleanParam(params.get("isActive")),
    sortBy: sortBy === "name" || sortBy === "createdAt" ? sortBy : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
}

export default function BrandsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseBrandParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deactivateBrand, setDeactivateBrand] = useState<Brand | null>(null);
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);
  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const brandsQuery = useAdminBrands(params);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const removeBrand = useDeleteBrand();

  function writeParams(next: Partial<BrandListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "isActive", merged.isActive);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    setSearchParams(output);
  }

  async function submitBrand(payload: BrandMutationPayload) {
    if (editingBrand) {
      return updateBrand.mutateAsync({ id: editingBrand.id, payload });
    }
    return createBrand.mutateAsync(payload);
  }

  async function updateStatus(brand: Brand, isActive: boolean) {
    setPendingBrandId(brand.id);
    try {
      await updateBrand.mutateAsync({
        id: brand.id,
        payload: {
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          logoUrl: brand.logoUrl,
          isActive,
        },
      });
    } finally {
      setPendingBrandId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteBrand) return;
    setPendingBrandId(deleteBrand.id);
    try {
      await removeBrand.mutateAsync(deleteBrand.id);
      setDeleteBrand(null);
    } finally {
      setPendingBrandId(null);
    }
  }

  const mutationError =
    updateBrand.error ?? createBrand.error ?? removeBrand.error ?? null;
  const brands = brandsQuery.data?.data ?? [];
  const meta = brandsQuery.data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Brands"
        description="Manage catalog brands, logos, and public visibility."
        isRefreshing={brandsQuery.isFetching}
        onRefresh={() => void brandsQuery.refetch()}
        createLabel="Create brand"
        onCreate={() => {
          setEditingBrand(null);
          setSheetOpen(true);
        }}
      />

      {cleanupWarning && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Logo cleanup needs attention</AlertTitle>
          <AlertDescription>{cleanupWarning}</AlertDescription>
        </Alert>
      )}

      <ActionErrorAlert error={mutationError} />

      <section className="overflow-hidden rounded-md border bg-background">
        <BrandsToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={brandsQuery.isFetching}
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
        {brandsQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={brandsQuery.error}
              retry={() => void brandsQuery.refetch()}
            />
          </div>
        ) : brands.length === 0 && !brandsQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No brands found"
              description="Create a brand or change the current filters."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setEditingBrand(null);
                    setSheetOpen(true);
                  }}
                >
                  Create brand
                </Button>
              }
            />
          </div>
        ) : (
          <BrandsTable
            brands={brands}
            loading={brandsQuery.isPending}
            pendingBrandId={pendingBrandId}
            onEdit={(brand) => {
              setEditingBrand(brand);
              setSheetOpen(true);
            }}
            onActivate={(brand) => void updateStatus(brand, true)}
            onDeactivate={setDeactivateBrand}
            onDelete={setDeleteBrand}
          />
        )}
        {meta && meta.total > 0 && (
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            isPending={brandsQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>

      <BrandFormSheet
        open={sheetOpen}
        brand={editingBrand}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingBrand(null);
        }}
        onSubmitBrand={submitBrand}
        onCleanupWarning={setCleanupWarning}
      />

      <ConfirmActionDialog
        open={!!deactivateBrand}
        onOpenChange={(open) => !open && setDeactivateBrand(null)}
        title="Deactivate brand?"
        description={`${deactivateBrand?.name ?? "This brand"} will be hidden from public brand listings. Products assigned to it stay available.`}
        actionLabel="Deactivate"
        onConfirm={() => {
          if (!deactivateBrand) return;
          void updateStatus(deactivateBrand, false).then(() =>
            setDeactivateBrand(null),
          );
        }}
      />

      <ConfirmActionDialog
        open={!!deleteBrand}
        onOpenChange={(open) => !open && setDeleteBrand(null)}
        title="Delete brand?"
        description="Products remain available, but their brand assignment will be cleared."
        actionLabel="Delete brand"
        actionVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
