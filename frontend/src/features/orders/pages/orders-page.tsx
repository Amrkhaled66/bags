import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { PaginationControls } from "@/shared/components/pagination-controls";
import { ErrorState } from "@/shared/components/request-state";
import {
  parseEnumParam,
  parsePositiveIntParam,
  writeSearchParam,
} from "@/shared/utils/search-params";
import { OrdersTable } from "../components/orders-table";
import { OrdersToolbar } from "../components/orders-toolbar";
import { useAdminOrders } from "../hooks/use-orders";
import type { OrderListParams, OrderStatus } from "../types/order";

const pageSize = 10;
const orderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[];

function parseOrderParams(params: URLSearchParams): OrderListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    status: parseEnumParam(params.get("status"), orderStatuses),
    governorate: params.get("governorate") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sortBy:
      sortBy === "total" || sortBy === "orderNumber" || sortBy === "createdAt"
        ? sortBy
        : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseOrderParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const ordersQuery = useAdminOrders(params);
  const orders = ordersQuery.data?.data ?? [];
  const meta = ordersQuery.data?.meta;

  function writeParams(next: Partial<OrderListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "status", merged.status);
    writeSearchParam(output, "governorate", merged.governorate);
    writeSearchParam(output, "from", merged.from);
    writeSearchParam(output, "to", merged.to);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    setSearchParams(output);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Orders"
        description="Review orders, customer details, totals, and fulfillment state."
        isRefreshing={ordersQuery.isFetching}
        onRefresh={() => void ordersQuery.refetch()}
      />

      <ActionErrorAlert
        error={ordersQuery.isError ? ordersQuery.error : null}
        title="Orders could not be loaded"
      />

      <section className="overflow-hidden rounded-md border bg-background">
        <OrdersToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={ordersQuery.isFetching}
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
        {ordersQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={ordersQuery.error}
              retry={() => void ordersQuery.refetch()}
            />
          </div>
        ) : orders.length === 0 && !ordersQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No orders found"
              description="Change the filters or wait for new checkout activity."
            />
          </div>
        ) : (
          <OrdersTable orders={orders} loading={ordersQuery.isPending} />
        )}
        {meta && meta.total > 0 && (
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            isPending={ordersQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>
    </div>
  );
}
