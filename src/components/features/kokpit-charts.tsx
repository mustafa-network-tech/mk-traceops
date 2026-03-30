"use client";

import dynamic from "next/dynamic";

const ProductionTrendChart = dynamic(
  () =>
    import("@/components/charts/production-trend-chart").then(
      (m) => m.ProductionTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
    ),
  },
);

const StockMixChart = dynamic(
  () =>
    import("@/components/charts/stock-mix-chart").then((m) => m.StockMixChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
    ),
  },
);

export function KokpitCharts({
  trend,
  mix,
}: {
  trend: { label: string; value: number }[];
  mix: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ProductionTrendChart data={trend} />
      <StockMixChart data={mix} />
    </div>
  );
}
