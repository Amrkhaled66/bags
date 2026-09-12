import { request } from "@/shared/api/client";
import type { Overview } from "../types/dashboard";
export const dashboardApi = {
  overview: (range: { from?: string; to?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    return request<Overview>(`/admin/dashboard/overview?${params}`, { signal });
  },
};
