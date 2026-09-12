import { Package, ShoppingCart, Users, Wallet } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/shared/utils/cn";
import type { Overview } from "../types/dashboard";
import { amount } from "../utils/format";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface MetricItem {
  label: string;
  value: number | string;
  note: string;
  icon: IconComponent;
  tone: "green" | "blue" | "rose" | "gold";
}

interface MetricsGridProps {
  overview: Overview;
}

const metricIconTones: Record<MetricItem["tone"], string> = {
  green: "bg-[#eaf4ed] text-[#256c50]",
  blue: "bg-[#edf1fa] text-[#3c6eaa]",
  rose: "bg-[#fcf0f2] text-[#b96070]",
  gold: "bg-[#faf3e6] text-[#a77a2f]",
};

function getMetricItems(overview: Overview): MetricItem[] {
  return [
    {
      label: "Gross sales",
      value: amount(overview.orders.grossSales),
      note: "Excluding cancelled orders",
      icon: Wallet,
      tone: "green",
    },
    {
      label: "Orders",
      value: overview.orders.total,
      note: "In selected period",
      icon: ShoppingCart,
      tone: "blue",
    },
    {
      label: "Customers",
      value: overview.customers.total,
      note: `${overview.customers.newInPeriod} new in selected period`,
      icon: Users,
      tone: "rose",
    },
    {
      label: "Products",
      value: overview.catalog.products,
      note: "Current catalog",
      icon: Package,
      tone: "gold",
    },
  ];
}

export function MetricsGrid({ overview }: MetricsGridProps) {
  return (
    <section
      aria-label="Store metrics"
      className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:gap-2.5"
    >
      {getMetricItems(overview).map(
        ({ label, value, note, icon: Icon, tone }) => (
          <article
            className="min-w-0 rounded-md border bg-background p-5 max-sm:p-3.5"
            key={label}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "grid size-[30px] place-items-center rounded-md",
                  metricIconTones[tone],
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p className="my-[18px] mb-2 overflow-anywhere text-[26px] font-semibold tabular-nums max-sm:text-[23px]">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </article>
        ),
      )}
    </section>
  );
}
