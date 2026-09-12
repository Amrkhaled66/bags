import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { PaginationControls } from "@/shared/components/pagination-controls";
import { ErrorState } from "@/shared/components/request-state";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  parseBooleanParam,
  parseEnumParam,
  parsePositiveIntParam,
  writeSearchParam,
} from "@/shared/utils/search-params";
import { ProductFormSheet } from "../components/product-form-sheet";
import { ProductsTable } from "../components/products-table";
import { ProductsToolbar } from "../components/products-toolbar";
import {
  useAdminProduct,
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/use-products";
import type {
  Product,
  ProductListParams,
  ProductMutationPayload,
} from "../types/product";

const pageSize = 10;
const productStatuses = ["draft", "active", "archived"] as const;

function parseProductParams(params: URLSearchParams): ProductListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    sortBy:
      sortBy === "name" || sortBy === "sellerPrice" || sortBy === "createdAt"
        ? sortBy
        : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
    status: parseEnumParam(params.get("status"), productStatuses),
    brandId: params.get("brandId") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    isFeatured: parseBooleanParam(params.get("isFeatured")),
    isNewArrival: parseBooleanParam(params.get("isNewArrival")),
  };
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseProductParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const productsQuery = useAdminProducts(params);
  const productDetailQuery = useAdminProduct(editingProductId ?? undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const removeProduct = useDeleteProduct();

  function writeParams(next: Partial<ProductListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    writeSearchParam(output, "status", merged.status);
    writeSearchParam(output, "brandId", merged.brandId);
    writeSearchParam(output, "categoryId", merged.categoryId);
    writeSearchParam(output, "isFeatured", merged.isFeatured);
    writeSearchParam(output, "isNewArrival", merged.isNewArrival);
    setSearchParams(output);
  }

  async function submitProduct(payload: ProductMutationPayload) {
    if (editingProductId) {
      return updateProduct.mutateAsync({ id: editingProductId, payload });
    }
    return createProduct.mutateAsync(payload);
  }

  async function confirmDelete() {
    if (!deleteProduct) return;
    setPendingProductId(deleteProduct.id);
    try {
      await removeProduct.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    } finally {
      setPendingProductId(null);
    }
  }

  const mutationError =
    updateProduct.error ?? createProduct.error ?? removeProduct.error ?? null;
  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Products"
        description="Manage catalog products, pricing, brands, categories, and visibility."
        isRefreshing={productsQuery.isFetching}
        onRefresh={() => void productsQuery.refetch()}
        createLabel="Create product"
        onCreate={() => {
          setEditingProductId(null);
          setSheetOpen(true);
        }}
      />

      <ActionErrorAlert error={mutationError} />

      {cleanupWarning && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Image cleanup needs attention</AlertTitle>
          <AlertDescription>{cleanupWarning}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-md border bg-background">
        <ProductsToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={productsQuery.isFetching}
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
        {productsQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={productsQuery.error}
              retry={() => void productsQuery.refetch()}
            />
          </div>
        ) : products.length === 0 && !productsQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No products found"
              description="Create a product or change the current filters."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setSheetOpen(true);
                  }}
                >
                  Create product
                </Button>
              }
            />
          </div>
        ) : (
          <ProductsTable
            products={products}
            loading={productsQuery.isPending}
            pendingProductId={pendingProductId}
            onEdit={(product) => {
              setEditingProductId(product.id);
              setSheetOpen(true);
            }}
            onDelete={setDeleteProduct}
          />
        )}
        {meta && meta.total > 0 && (
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            isPending={productsQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>

      <ProductFormSheet
        open={sheetOpen}
        product={editingProductId ? productDetailQuery.data : null}
        loadingProduct={!!editingProductId && productDetailQuery.isPending}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingProductId(null);
        }}
        onSubmitProduct={submitProduct}
        onCleanupWarning={setCleanupWarning}
      />

      <ConfirmActionDialog
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
        title="Delete product?"
        description="This removes the product, its category assignments, variants, and inventory records."
        actionLabel="Delete product"
        actionVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
