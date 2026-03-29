"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Row = {
  id: string;
  status: string;
  warehouse_location_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  created_at?: string;
};

export default function TripsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void apiFetch<Row[]>("/trips").then(setRows);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Trips</h1>
      <DataTable<Row & Record<string, unknown>>
        columns={[
          {
            key: "id",
            header: "Trip",
            render: (r) => (
              <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href={`/trips/${(r as Row).id}`}>
                {(r as Row).id.slice(0, 8)}…
              </Link>
            ),
          },
          { key: "status", header: "Status" },
        ]}
        rows={rows as (Row & Record<string, unknown>)[]}
      />
    </div>
  );
}
