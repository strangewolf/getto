"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { OrderCreateForm } from "@/components/OrderCreateForm";
import { RoleGuard } from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api";

type Row = {
  id: string;
  status: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  priority: number;
};

export default function OrdersPage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function reload() {
    const data = await apiFetch<Row[]>("/orders");
    setRows(data);
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Replenishment requests</p>
        </div>
      </div>
      <RoleGuard allow={["admin", "retailer", "warehouse_manager"]}>
        <OrderCreateForm onCreated={reload} />
      </RoleGuard>
      <DataTable<Row & Record<string, unknown>>
        columns={[
          {
            key: "id",
            header: "ID",
            render: (r) => (
              <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href={`/orders/${r.id}`}>
                {(r as Row).id.slice(0, 8)}…
              </Link>
            ),
          },
          { key: "status", header: "Status" },
          { key: "priority", header: "Priority" },
        ]}
        rows={rows as (Row & Record<string, unknown>)[]}
      />
    </div>
  );
}
