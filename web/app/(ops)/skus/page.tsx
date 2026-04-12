"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Sku = {
  id: string;
  sku_code: string;
  name: string;
  uom: string;
  weight_kg: number | null;
  volume_m3: number | null;
};

function formatKg(kg: number | null) {
  if (kg == null) return null;
  return `${kg} kg`;
}

function formatM3(m3: number | null) {
  if (m3 == null) return null;
  return `${m3} m³`;
}

export default function SkusPage() {
  const [rows, setRows] = useState<Sku[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetch<Sku[]>("/skus");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SKUs</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Master product catalog: codes, display names, and units of measure used across orders and inventory.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All SKUs</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Identifier, description, unit of measure, and optional weight / cube from the mock API.
        </p>
        <DataTable<Sku & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "sku_code",
              header: "Code",
              cellClass: "min-w-[9rem] max-w-[12rem]",
              render: (r) => {
                const s = r as Sku;
                return (
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{s.sku_code}</div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{s.id}</div>
                  </div>
                );
              },
            },
            {
              key: "name",
              header: "Product",
              cellClass: "min-w-[14rem] max-w-[26rem]",
              render: (r) => {
                const s = r as Sku;
                return <div className="text-sm leading-snug text-zinc-900 dark:text-zinc-100">{s.name}</div>;
              },
            },
            {
              key: "uom",
              header: "Unit",
              cellClass: "whitespace-nowrap",
              render: (r) => {
                const s = r as Sku;
                return <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{s.uom}</span>;
              },
            },
            {
              key: "weight_kg",
              header: "Weight & volume",
              sortable: false,
              cellClass: "min-w-[11rem]",
              render: (r) => {
                const s = r as Sku;
                const w = formatKg(s.weight_kg);
                const v = formatM3(s.volume_m3);
                if (!w && !v) {
                  return <span className="text-xs text-zinc-500 dark:text-zinc-400">Not set</span>;
                }
                return (
                  <div className="space-y-0.5 text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                    {w ? <div>{w}</div> : null}
                    {v ? <div>{v}</div> : null}
                  </div>
                );
              },
            },
          ]}
          rows={rows as (Sku & Record<string, unknown>)[]}
          pageSize={12}
        />
      </div>
    </div>
  );
}
