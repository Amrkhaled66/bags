import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { sessionStorage } from "@/shared/api/session-storage";
import { authApi } from "../api/auth.api";

export function useSession() {
  const token = useSyncExternalStore(
    sessionStorage.subscribe,
    sessionStorage.getToken,
  );
  const query = useQuery({
    queryKey: ["auth", "admin"],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: !!token,
    staleTime: 0,
    retry: false,
  });
  return { ...query, hasToken: !!token };
}
