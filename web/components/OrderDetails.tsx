"use client";

import Link from "next/link";

export type OrderLine = {
  id: string;
  sku_id: string;
  sku_code?: string;
  sku_name?: string;
  qty_requested: number;
  qty_allocated: number;
  status: string;
};

export type OrderDetail = {
  id: string;
  status: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  retailer_location_name?: string;
  warehouse_location_name?: string;
  priority: number;
  created_at?: string;
  requested_window_start?: string | null;
  requested_window_end?: string | null;
  lines: OrderLine[];
};

export function OrderDetails({ order }: { order: OrderDetail }) {
  return (
    <div className="card-chamfer p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase text-zinc-500">Order</div>
          <div className="font-mono text-sm">{order.id}</div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            order.status === "ready_to_ship"
              ? "bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-200"
              : order.status === "pending_allocation"
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {order.status}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-zinc-500">Retailer · </span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {order.retailer_location_name ?? order.retailer_location_id}
          </span>
          {order.retailer_location_name && order.retailer_location_name !== order.retailer_location_id ? (
            <span className="ml-1 font-mono text-xs text-zinc-500">({order.retailer_location_id})</span>
          ) : null}
        </div>
        <div>
          <span className="text-zinc-500">Warehouse · </span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {order.warehouse_location_name ?? order.warehouse_location_id}
          </span>
          {order.warehouse_location_name && order.warehouse_location_name !== order.warehouse_location_id ? (
            <span className="ml-1 font-mono text-xs text-zinc-500">({order.warehouse_location_id})</span>
          ) : null}
        </div>
      </div>
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="text-xs font-semibold uppercase text-zinc-500">Lines</div>
        <ul className="mt-2 space-y-2">
          {order.lines.map((ln) => (
            <li key={ln.id} className="chamfer-clip-sm flex flex-wrap justify-between gap-2 bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60">
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ln.sku_code ?? ln.sku_id}</span>
                {ln.sku_name ? <span className="text-zinc-600 dark:text-zinc-300"> · {ln.sku_name}</span> : null}
              </span>
              <span className="tabular-nums">
                alloc {ln.qty_allocated} / req {ln.qty_requested} · {ln.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <Link href="/orders" className="text-sm text-primary-700 hover:underline dark:text-primary-400">
          ← Back to orders
        </Link>
      </div>
    </div>
  );
}
