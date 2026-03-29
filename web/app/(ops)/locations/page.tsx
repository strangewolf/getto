"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Row = { id: string; type: string; name: string; lat: number | null; lng: number | null };

export default function LocationsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void apiFetch<Row[]>("/locations").then(setRows);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Locations</h1>
      <DataTable<Row & Record<string, unknown>>
        columns={[
          { key: "name", header: "Name" },
          { key: "type", header: "Type" },
          { key: "lat", header: "Lat" },
          { key: "lng", header: "Lng" },
        ]}
        rows={rows as (Row & Record<string, unknown>)[]}
      />
    </div>
  );
}
