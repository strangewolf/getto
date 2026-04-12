"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type InvRow = {
  id: string;
  location_id: string;
  location_name: string;
  location_type: string;
  sku_id: string;
  sku_code: string;
  sku_name: string;
  on_hand: number;
  reserved: number;
  available: number;
};

function typeLabel(t: string) {
  if (t === "retailer") return "Retailer";
  if (t === "warehouse") return "Warehouse";
  return t ? t.replace(/_/g, " ") : "—";
}

function typePillClass(t: string) {
  if (t === "warehouse")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (t === "retailer")
    return "bg-sky-200/90 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

export default function InventoryPage() {
  const [rows, setRows] = useState<InvRow[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetch<InvRow[]>("/inventory");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          On-hand, reserved, and available balances by location and SKU from the mock API (used for allocation and transfers).
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All balances</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          One row per location–SKU pair; quantities update when orders allocate or transfers move stock.
        </p>
        <DataTable<InvRow & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "id",
              header: "Record",
              cellClass: "min-w-[10rem] max-w-[13rem]",
              render: (r) => {
                const row = r as InvRow;
                return (
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.id}</div>
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Balance row</div>
                  </div>
                );
              },
            },
            {
              key: "location_name",
              header: "Location",
              cellClass: "min-w-[14rem] max-w-[22rem]",
              render: (r) => {
                const row = r as InvRow;
                return (
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.location_name}</div>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typePillClass(row.location_type)}`}
                      >
                        {typeLabel(row.location_type)}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.location_id}</div>
                  </div>
                );
              },
            },
            {
              key: "sku_code",
              header: "SKU",
              cellClass: "min-w-[14rem] max-w-[24rem]",
              render: (r) => {
                const row = r as InvRow;
                return (
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.sku_code}</span>
                      {row.sku_name ? (
                        <span className="text-zinc-600 dark:text-zinc-300"> · {row.sku_name}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.sku_id}</div>
                  </div>
                );
              },
            },
            {
              key: "on_hand",
              header: "Quantities",
              sortable: false,
              cellClass: "min-w-[12rem]",
              render: (r) => {
                const row = r as InvRow;
                return (
                  <ul className="list-none space-y-1 text-xs leading-snug">
                    <li className="tabular-nums text-zinc-900 dark:text-zinc-100">
                      <span className="text-zinc-500 dark:text-zinc-400">On hand · </span>
                      {row.on_hand}
                    </li>
                    <li className="tabular-nums text-zinc-600 dark:text-zinc-300">
                      <span className="text-zinc-500 dark:text-zinc-400">Reserved · </span>
                      {row.reserved}
                    </li>
                    <li className="tabular-nums font-medium text-primary-700 dark:text-primary-300">
                      <span className="font-normal text-zinc-500 dark:text-zinc-400">Available · </span>
                      {row.available}
                    </li>
                  </ul>
                );
              },
            },
          ]}
          rows={rows as (InvRow & Record<string, unknown>)[]}
          pageSize={12}
        />
      </div>
    </div>
  );
}
