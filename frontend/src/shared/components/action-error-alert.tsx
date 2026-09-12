import { AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/shared/utils/error-message";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function ActionErrorAlert({
  error,
  title = "Action failed",
}: {
  error: unknown;
  title?: string;
}) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{getErrorMessage(error)}</AlertDescription>
    </Alert>
  );
}
