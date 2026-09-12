import { Link, useRouteError } from "react-router";
import { ErrorState } from "@/shared/components/request-state";

export function RouteError() {
  const error = useRouteError();
  return (
    <main className="mx-auto max-w-xl p-8">
      <ErrorState error={error} />
      <Link className="mt-4 inline-block underline" to="/admin">
        Back to overview
      </Link>
    </main>
  );
}
export function NotFound() {
  return (
    <main className="mx-auto max-w-lg p-12">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link className="mt-4 inline-block underline" to="/admin">
        Back to overview
      </Link>
    </main>
  );
}
