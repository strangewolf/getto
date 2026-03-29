"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Row = { id: string; sku_code: string; name: string; uom: string };

export default function SkusPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void apiFetch<Row[]>("/skus").then(setRows);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SKUs</h1>
      <DataTable<Row & Record<string, unknown>>
        columns={[
          { key: "sku_code", header: "Code" },
          { key: "name", header: "Name" },
          { key: "uom", header: "UoM" },
        ]}
        rows={rows as (Row & Record<string, unknown>)[]}
      />
    </div>
  );
}
