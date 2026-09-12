import { Button } from "@/shared/components/ui/button";
import { ErrorState } from "@/shared/components/request-state";
import { sessionStorage } from "@/shared/api/session-storage";

interface SessionErrorPanelProps {
  error: unknown;
  retry: () => void;
}

export function SessionErrorPanel({ error, retry }: SessionErrorPanelProps) {
  return (
    <main className="mx-auto max-w-lg p-6">
      <ErrorState error={error} retry={retry} />
      <Button
        className="mt-4"
        variant="outline"
        onClick={() => sessionStorage.setToken(null)}
      >
        Back to sign in
      </Button>
    </main>
  );
}
