import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
export function useOverview(range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["dashboard", "overview", range],
    queryFn: ({ signal }) => dashboardApi.overview(range, signal),
  });
}
