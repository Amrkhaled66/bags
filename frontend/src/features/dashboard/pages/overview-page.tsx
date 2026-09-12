import { useSearchParams } from "react-router";
import { LoadingState, ErrorState } from "@/shared/components/request-state";
import { AttentionPanel } from "../components/attention-panel";
import { MetricsGrid } from "../components/metrics-grid";
import { OrderStatusStrip } from "../components/order-status-strip";
import { OverviewHeader } from "../components/overview-header";
import { RecentOrdersTable } from "../components/recent-orders-table";
import { useOverview } from "../hooks/use-overview";
import {
  getOverviewRange,
  parseOverviewPeriod,
} from "../utils/overview-period";

export default function OverviewPage() {
  const [params, setParams] = useSearchParams();
  const period = parseOverviewPeriod(params.get("period"));
  const range = getOverviewRange(period);
  const query = useOverview(range);

  return (
    <>
      <OverviewHeader
        isRefreshing={query.isFetching}
        period={period}
        onPeriodChange={(nextPeriod) =>
          setParams(nextPeriod === "all" ? {} : { period: nextPeriod })
        }
        onRefresh={() => void query.refetch()}
      />
      {query.isPending ? (
        <LoadingState label="Loading store overview..." />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <MetricsGrid overview={query.data} />
          <OrderStatusStrip overview={query.data} />
          <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-8 max-xl:grid-cols-1">
            <RecentOrdersTable orders={query.data.orders.recent} />
            <AttentionPanel overview={query.data} />
          </div>
        </>
      )}
    </>
  );
}
