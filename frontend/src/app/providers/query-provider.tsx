import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/client";
import { sessionStorage } from "@/shared/api/session-storage";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, error) =>
              count < 1 &&
              !(
                error instanceof ApiError &&
                error.status >= 400 &&
                error.status < 500
              ),
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(
    () =>
      sessionStorage.subscribe(() => {
        client.clear();
      }),
    [client],
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
