import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  isPending,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isPending?: boolean;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isPending}
        >
          <ChevronLeft />
          Previous
        </Button>
        <span className="min-w-20 text-center text-muted-foreground">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isPending}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
