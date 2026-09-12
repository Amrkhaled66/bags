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
  parsePositiveIntParam,
  writeSearchParam,
} from "@/shared/utils/search-params";
import { CategoriesTable } from "../components/categories-table";
import { CategoriesToolbar } from "../components/categories-toolbar";
import { CategoryFormSheet } from "../components/category-form-sheet";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/use-categories";
import type {
  Category,
  CategoryListParams,
  CategoryMutationPayload,
} from "../types/category";

const pageSize = 10;

function parseCategoryParams(params: URLSearchParams): CategoryListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    sortBy: sortBy === "name" || sortBy === "createdAt" ? sortBy : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
}

function applyCategoryParams(
  categories: Category[],
  params: CategoryListParams,
) {
  const search = params.search?.trim().toLowerCase();
  const filtered = search
    ? categories.filter(
        (category) =>
          category.name.toLowerCase().includes(search) ||
          category.slug.toLowerCase().includes(search),
      )
    : categories;
  const sorted = filtered.toSorted((left, right) => {
    const direction = params.sortOrder === "asc" ? 1 : -1;
    if (params.sortBy === "name") {
      return left.name.localeCompare(right.name) * direction;
    }
    return (
      (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) *
      direction
    );
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

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseCategoryParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const removeCategory = useDeleteCategory();
  const result = useMemo(
    () => applyCategoryParams(categoriesQuery.data ?? [], params),
    [categoriesQuery.data, params],
  );

  function writeParams(next: Partial<CategoryListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    setSearchParams(output);
  }

  async function submitCategory(payload: CategoryMutationPayload) {
    if (editingCategory) {
      return updateCategory.mutateAsync({ id: editingCategory.id, payload });
    }
    return createCategory.mutateAsync(payload);
  }

  async function confirmDelete() {
    if (!deleteCategory) return;
    setPendingCategoryId(deleteCategory.id);
    try {
      await removeCategory.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    } finally {
      setPendingCategoryId(null);
    }
  }

  const mutationError =
    updateCategory.error ?? createCategory.error ?? removeCategory.error ?? null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Categories"
        description="Manage catalog categories and storefront images."
        isRefreshing={categoriesQuery.isFetching}
        onRefresh={() => void categoriesQuery.refetch()}
        createLabel="Create category"
        onCreate={() => {
          setEditingCategory(null);
          setSheetOpen(true);
        }}
      />

      {cleanupWarning && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Image cleanup needs attention</AlertTitle>
          <AlertDescription>{cleanupWarning}</AlertDescription>
        </Alert>
      )}

      <ActionErrorAlert error={mutationError} />

      <section className="overflow-hidden rounded-md border bg-background">
        <CategoriesToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={categoriesQuery.isFetching}
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
        {categoriesQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={categoriesQuery.error}
              retry={() => void categoriesQuery.refetch()}
            />
          </div>
        ) : result.data.length === 0 && !categoriesQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No categories found"
              description="Create a category or change the current filters."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setSheetOpen(true);
                  }}
                >
                  Create category
                </Button>
              }
            />
          </div>
        ) : (
          <CategoriesTable
            categories={result.data}
            loading={categoriesQuery.isPending}
            pendingCategoryId={pendingCategoryId}
            onEdit={(category) => {
              setEditingCategory(category);
              setSheetOpen(true);
            }}
            onDelete={setDeleteCategory}
          />
        )}
        {result.meta.total > 0 && (
          <PaginationControls
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            total={result.meta.total}
            pageSize={result.meta.limit}
            isPending={categoriesQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>

      <CategoryFormSheet
        open={sheetOpen}
        category={editingCategory}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSubmitCategory={submitCategory}
        onCleanupWarning={setCleanupWarning}
      />

      <ConfirmActionDialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        title="Delete category?"
        description="This removes the category. If products are still assigned to it, the backend may reject the delete until those assignments are removed."
        actionLabel="Delete category"
        actionVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
