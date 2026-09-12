import { RouterProvider } from "react-router";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryProvider } from "./providers/query-provider";
import { router } from "./router/router";

export default function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryProvider>
  );
}
