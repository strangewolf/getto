"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/KpiCards";
import { apiFetch } from "@/lib/api";

type Exc = { failed_or_partial_stops: number; total_stops: number };

export default function ReportsPage() {
  const [exc, setExc] = useState<Exc | null>(null);

  useEffect(() => {
    void apiFetch<Exc>("/reports/exceptions?days=30").then(setExc);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Exceptions and service levels
        </p>
      </div>
      <KpiCards
        items={[
          {
            label: "Exception stops",
            value: exc?.failed_or_partial_stops ?? "—",
            hint: exc ? `of ${exc.total_stops} stops` : undefined,
          },
        ]}
      />
    </div>
  );
}
