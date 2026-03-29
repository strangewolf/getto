"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { RoleGuard } from "@/components/RoleGuard";
import { TransferCreateForm } from "@/components/TransferCreateForm";
import { apiFetch } from "@/lib/api";

type Line = {
  id: string;
  sku_id: string;
  qty_requested: number;
  qty_shipped: number;
  qty_received: number;
};

type Transfer = {
  id: string;
  status: string;
  from_location_id: string;
  to_location_id: string;
  lines: Line[];
};

export default function TransfersPage() {
  const [rows, setRows] = useState<Transfer[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await apiFetch<Transfer[]>("/transfers");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function ship(id: string) {
    setMsg(null);
    try {
      await apiFetch(`/transfers/${id}/ship`, { method: "POST" });
      setMsg("Shipped (stock left source).");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ship failed");
    }
  }

  async function receive(id: string) {
    setMsg(null);
    try {
      await apiFetch(`/transfers/${id}/receive`, { method: "POST" });
      setMsg("Received at destination.");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Receive failed");
    }
  }

  async function cancel(id: string) {
    setMsg(null);
    try {
      await apiFetch(`/transfers/${id}/cancel`, { method: "POST" });
      setMsg("Cancelled.");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inter-warehouse transfers</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Rebalance stock between warehouses (ship from source, receive at destination).
        </p>
      </div>
      {msg ? <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">{msg}</div> : null}
      <RoleGuard allow={["admin", "warehouse_manager"]}>
        <TransferCreateForm onCreated={reload} />
      </RoleGuard>
      <DataTable<Transfer & Record<string, unknown>>
        columns={[
          { key: "id", header: "Transfer ID", render: (r) => <span className="font-mono text-xs">{(r as Transfer).id.slice(0, 8)}…</span> },
          { key: "status", header: "Status" },
          {
            key: "lines",
            header: "Lines",
            render: (r) => <span className="text-xs">{(r as Transfer).lines.length} SKU(s)</span>,
          },
          {
            key: "_actions",
            header: "Actions",
            render: (r) => {
              const t = r as Transfer;
              return (
                <div className="flex flex-wrap gap-1">
                  {t.status === "draft" ? (
                    <>
                      <button
                        type="button"
                        className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                        onClick={() => void ship(t.id)}
                      >
                        Ship
                      </button>
                      <button
                        type="button"
                        className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                        onClick={() => void cancel(t.id)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                  {t.status === "in_transit" ? (
                    <button
                      type="button"
                      className="rounded border border-emerald-600 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                      onClick={() => void receive(t.id)}
                    >
                      Receive
                    </button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        rows={rows as (Transfer & Record<string, unknown>)[]}
        pageSize={12}
      />
    </div>
  );
}
