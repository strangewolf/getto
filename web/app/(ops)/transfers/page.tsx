"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { RoleGuard } from "@/components/RoleGuard";
import { TransferCreateForm } from "@/components/TransferCreateForm";
import { apiFetch } from "@/lib/api";

type Line = {
  id: string;
  sku_id: string;
  sku_code: string;
  sku_name: string;
  qty_requested: number;
  qty_shipped: number;
  qty_received: number;
};

type Transfer = {
  id: string;
  from_location_id: string;
  to_location_id: string;
  from_location_name: string;
  to_location_name: string;
  status: string;
  notes: string | null;
  created_at: string;
  lines: Line[];
};

function formatCreated(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draft",
    in_transit: "In transit",
    received: "Received",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function statusPillClass(status: string) {
  if (status === "draft") return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
  if (status === "in_transit") return "bg-sky-200/90 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100";
  if (status === "received")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (status === "cancelled") return "bg-red-200/90 text-red-950 dark:bg-red-950/60 dark:text-red-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

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
      {msg ? (
        <div className="chamfer-clip-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {msg}
        </div>
      ) : null}
      <RoleGuard allow={["admin", "warehouse_manager"]}>
        <TransferCreateForm onCreated={() => reload()} />
      </RoleGuard>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All transfers</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Route, line-level quantities (requested / shipped / received), and notes from the mock API.
        </p>
        <DataTable<Transfer & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "created_at",
              header: "Created",
              cellClass: "min-w-[10.5rem] max-w-[13rem]",
              render: (r) => {
                const t = r as Transfer;
                return (
                  <div className="space-y-0.5">
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">{formatCreated(t.created_at)}</div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{t.id}</div>
                  </div>
                );
              },
            },
            {
              key: "from_location_name",
              header: "Route",
              cellClass: "min-w-[14rem] max-w-[22rem]",
              render: (r) => {
                const t = r as Transfer;
                return (
                  <div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium">{t.from_location_name}</span>
                      <span className="mx-1.5 text-zinc-400">→</span>
                      <span className="font-medium">{t.to_location_name}</span>
                    </div>
                    {t.notes ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                        {t.notes}
                      </p>
                    ) : null}
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              cellClass: "whitespace-nowrap",
              render: (r) => {
                const t = r as Transfer;
                return (
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusPillClass(t.status)}`}
                  >
                    {statusLabel(t.status)}
                  </span>
                );
              },
            },
            {
              key: "lines_detail",
              header: "Lines & quantities",
              sortable: false,
              cellClass: "min-w-[16rem] max-w-[28rem]",
              render: (r) => {
                const t = r as Transfer;
                return (
                  <ul className="list-none space-y-1.5">
                    {t.lines.map((l) => (
                      <li key={l.id} className="text-xs leading-snug">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{l.sku_code}</span>
                        {l.sku_name ? (
                          <span className="text-zinc-600 dark:text-zinc-300"> · {l.sku_name}</span>
                        ) : null}
                        <div className="mt-0.5 tabular-nums text-zinc-500 dark:text-zinc-400">
                          req {l.qty_requested} · shipped {l.qty_shipped} · received {l.qty_received}
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              },
            },
            {
              key: "_actions",
              header: "Actions",
              sortable: false,
              cellClass: "min-w-[12rem] whitespace-normal",
              render: (r) => {
                const t = r as Transfer;
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    {t.status === "draft" ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 sm:min-h-9 sm:py-1.5"
                          onClick={() => void ship(t.id)}
                        >
                          Ship
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 sm:min-h-9 sm:py-1.5"
                          onClick={() => void cancel(t.id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                    {t.status === "in_transit" ? (
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary-500/80 bg-primary-950/60 px-4 py-2 text-sm font-semibold text-primary-100 shadow-sm shadow-primary-950/40 hover:border-primary-400 hover:bg-primary-900/50 sm:min-h-9 sm:py-1.5"
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
    </div>
  );
}
