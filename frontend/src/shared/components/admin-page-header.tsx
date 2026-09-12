import type { ReactNode } from "react";
import { ArrowLeft, Plus, RefreshCcw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./ui/button";

export function AdminPageHeader({
  title,
  description,
  isRefreshing,
  onRefresh,
  createLabel,
  onCreate,
  backTo,
  backLabel,
  badges,
}: {
  title: ReactNode;
  description?: ReactNode;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  createLabel?: string;
  onCreate?: () => void;
  backTo?: string;
  backLabel?: string;
  badges?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        {backTo && backLabel && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={backTo}>
              <ArrowLeft />
              {backLabel}
            </Link>
          </Button>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
            {badges}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {(onRefresh || onCreate) && (
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
          )}
          {onCreate && createLabel && (
            <Button type="button" onClick={onCreate}>
              <Plus />
              {createLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
