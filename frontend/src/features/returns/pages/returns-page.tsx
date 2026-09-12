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
import { ReturnsTable } from "../components/returns-table";
import { ReturnsToolbar } from "../components/returns-toolbar";
import { useAdminReturns } from "../hooks/use-returns";
import type { ReturnListParams, ReturnStatus } from "../types/return";

const pageSize = 10;
const returnStatuses = [
  "requested",
  "approved",
  "rejected",
  "received",
  "completed",
] as const satisfies readonly ReturnStatus[];

function parseReturnParams(params: URLSearchParams): ReturnListParams {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  return {
    page: parsePositiveIntParam(params.get("page"), 1),
    limit: pageSize,
    search: params.get("search") ?? undefined,
    status: parseEnumParam(params.get("status"), returnStatuses),
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sortBy: sortBy === "status" || sortBy === "createdAt" ? sortBy : "createdAt",
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
}

export default function ReturnsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseReturnParams(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = useState(params.search ?? "");
  const returnsQuery = useAdminReturns(params);
  const returns = returnsQuery.data?.data ?? [];
  const meta = returnsQuery.data?.meta;

  function writeParams(next: Partial<ReturnListParams>) {
    const merged = { ...params, ...next };
    const output = new URLSearchParams();
    writeSearchParam(output, "page", merged.page, 1);
    writeSearchParam(output, "search", merged.search);
    writeSearchParam(output, "status", merged.status);
    writeSearchParam(output, "from", merged.from);
    writeSearchParam(output, "to", merged.to);
    writeSearchParam(output, "sortBy", merged.sortBy, "createdAt");
    writeSearchParam(output, "sortOrder", merged.sortOrder, "desc");
    setSearchParams(output);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Returns"
        description="Review return requests, item quantities, and refund completion."
        isRefreshing={returnsQuery.isFetching}
        onRefresh={() => void returnsQuery.refetch()}
      />

      <ActionErrorAlert
        error={returnsQuery.isError ? returnsQuery.error : null}
        title="Returns could not be loaded"
      />

      <section className="overflow-hidden rounded-md border bg-background">
        <ReturnsToolbar
          draftSearch={draftSearch}
          params={params}
          isPending={returnsQuery.isFetching}
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
        {returnsQuery.isError ? (
          <div className="p-4">
            <ErrorState
              error={returnsQuery.error}
              retry={() => void returnsQuery.refetch()}
            />
          </div>
        ) : returns.length === 0 && !returnsQuery.isPending ? (
          <div className="p-4">
            <EmptyState
              title="No returns found"
              description="Change the filters or wait for new return requests."
            />
          </div>
        ) : (
          <ReturnsTable returns={returns} loading={returnsQuery.isPending} />
        )}
        {meta && meta.total > 0 && (
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            isPending={returnsQuery.isFetching}
            onPageChange={(page) => writeParams({ page })}
          />
        )}
      </section>
    </div>
  );
}
