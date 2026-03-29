"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Row = {
  id: string;
  location_name: string;
  sku_code: string;
  on_hand: number;
  reserved: number;
  available: number;
};

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void apiFetch<Row[]>("/inventory").then(setRows);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <DataTable<Row & Record<string, unknown>>
        columns={[
          { key: "location_name", header: "Location" },
          { key: "sku_code", header: "SKU" },
          { key: "on_hand", header: "On hand" },
          { key: "reserved", header: "Reserved" },
          { key: "available", header: "Available" },
        ]}
        rows={rows as (Row & Record<string, unknown>)[]}
        pageSize={20}
      />
    </div>
  );
}
