"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/KpiCards";
import { apiFetch } from "@/lib/api";

type Otd = {
  on_time_rate: number;
  total_deliveries: number;
  late_or_failed: number;
};
type Util = {
  avg_stops_per_trip: number;
  trips_in_period: number;
  completed_trips: number;
};

export default function DashboardPage() {
  const [otd, setOtd] = useState<Otd | null>(null);
  const [util, setUtil] = useState<Util | null>(null);

  useEffect(() => {
    void (async () => {
      const [a, b] = await Promise.all([
        apiFetch<Otd>("/reports/otd?days=30"),
        apiFetch<Util>("/reports/utilization?days=30"),
      ]);
      setOtd(a);
      setUtil(b);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pilot KPIs for replenishment and trips
        </p>
      </div>
      <KpiCards
        items={[
          {
            label: "On-time delivery",
            value: otd ? `${(otd.on_time_rate * 100).toFixed(1)}%` : "—",
            hint: "Last 30 days",
          },
          {
            label: "Trips (period)",
            value: util?.trips_in_period ?? "—",
            hint: "Created in window",
          },
          {
            label: "Avg stops / trip",
            value: util ? util.avg_stops_per_trip.toFixed(2) : "—",
            hint: "Density",
          },
          {
            label: "Exceptions (late/fail)",
            value: otd?.late_or_failed ?? "—",
            hint: "POD outcomes",
          },
        ]}
      />
    </div>
  );
}
