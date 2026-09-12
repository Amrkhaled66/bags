import { Navigate, Outlet, useLocation } from "react-router";
import { LoadingState, ErrorState } from "@/shared/components/request-state";
import { useSession } from "../hooks/use-session";

export function RequireAdmin() {
  const session = useSession();
  const location = useLocation();
  if (!session.hasToken)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (session.isPending)
    return <LoadingState label="Checking your session..." />;
  if (session.isError)
    return (
      <main className="mx-auto max-w-lg p-6">
        <ErrorState
          error={session.error}
          retry={() => void session.refetch()}
        />
      </main>
    );
  return <Outlet />;
}
