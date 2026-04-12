"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { OrderCreateForm } from "@/components/OrderCreateForm";
import { RoleGuard } from "@/components/RoleGuard";
import { apiFetch } from "@/lib/api";

type OrderLine = {
  id: string;
  sku_id: string;
  sku_code: string;
  sku_name: string;
  qty_requested: number;
  qty_allocated: number;
  status: string;
};

type Order = {
  id: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  retailer_location_name: string;
  warehouse_location_name: string;
  status: string;
  priority: number;
  requested_window_start: string | null;
  requested_window_end: string | null;
  created_at: string;
  lines: OrderLine[];
};

function formatCreated(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatRequestedWindow(start: string | null, end: string | null) {
  if (!start && !end) return null;
  try {
    const a = start
      ? new Date(start).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
      : "—";
    const b = end
      ? new Date(end).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
      : "—";
    return `${a} → ${b}`;
  } catch {
    return null;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_allocation: "Pending allocation",
    in_fulfillment: "In fulfillment",
    ready_to_ship: "Ready to ship",
    delivered: "Delivered",
    shipped: "Shipped",
    cancelled: "Cancelled",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function statusPillClass(status: string) {
  if (status === "pending_allocation")
    return "bg-amber-200/90 text-amber-950 dark:bg-amber-950/80 dark:text-amber-100";
  if (status === "ready_to_ship")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (status === "in_fulfillment")
    return "bg-sky-200/90 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100";
  if (status === "delivered" || status === "shipped")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (status === "cancelled") return "bg-red-200/90 text-red-950 dark:bg-red-950/60 dark:text-red-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetch<Order[]>("/orders");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Replenishment requests from retailers to warehouses (lines and fulfillment from the mock API).
        </p>
      </div>
      <RoleGuard allow={["admin", "retailer", "warehouse_manager"]}>
        <OrderCreateForm onCreated={() => reload()} />
      </RoleGuard>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All orders</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Created time, retailer → warehouse route, line-level requested vs allocated, and priority from the mock API.
        </p>
        <DataTable<Order & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "created_at",
              header: "Created",
              cellClass: "min-w-[10.5rem] max-w-[13rem]",
              render: (r) => {
                const o = r as Order;
                return (
                  <div className="space-y-0.5">
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">{formatCreated(o.created_at)}</div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{o.id}</div>
                    <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">Priority · {o.priority}</div>
                  </div>
                );
              },
            },
            {
              key: "retailer_location_name",
              header: "Route",
              cellClass: "min-w-[14rem] max-w-[22rem]",
              render: (r) => {
                const o = r as Order;
                const windowText = formatRequestedWindow(o.requested_window_start, o.requested_window_end);
                return (
                  <div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium">{o.retailer_location_name}</span>
                      <span className="mx-1.5 text-zinc-400">→</span>
                      <span className="font-medium">{o.warehouse_location_name}</span>
                    </div>
                    {windowText ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                        Requested window · {windowText}
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
                const o = r as Order;
                return (
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusPillClass(o.status)}`}
                  >
                    {statusLabel(o.status)}
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
                const o = r as Order;
                return (
                  <ul className="list-none space-y-1.5">
                    {o.lines.map((l) => (
                      <li key={l.id} className="text-xs leading-snug">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{l.sku_code}</span>
                        {l.sku_name ? <span className="text-zinc-600 dark:text-zinc-300"> · {l.sku_name}</span> : null}
                        <div className="mt-0.5 tabular-nums text-zinc-500 dark:text-zinc-400">
                          req {l.qty_requested} · allocated {l.qty_allocated} · {l.status}
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
              cellClass: "min-w-[9rem] whitespace-normal",
              render: (r) => {
                const o = r as Order;
                return (
                  <Link
                    href={`/orders/${o.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 sm:min-h-9 sm:py-1.5"
                  >
                    Open
                  </Link>
                );
              },
            },
          ]}
          rows={rows as (Order & Record<string, unknown>)[]}
          pageSize={12}
        />
      </div>
    </div>
  );
}
