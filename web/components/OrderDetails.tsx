"use client";

import Link from "next/link";

export type OrderLine = {
  id: string;
  sku_id: string;
  qty_requested: number;
  qty_allocated: number;
  status: string;
};

export type OrderDetail = {
  id: string;
  status: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  priority: number;
  lines: OrderLine[];
};

export function OrderDetails({ order }: { order: OrderDetail }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase text-zinc-500">Order</div>
          <div className="font-mono text-sm">{order.id}</div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            order.status === "ready_to_ship"
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
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
          <span className="text-zinc-500">Retailer loc · </span>
          <span className="font-mono text-xs">{order.retailer_location_id}</span>
        </div>
        <div>
          <span className="text-zinc-500">Warehouse loc · </span>
          <span className="font-mono text-xs">{order.warehouse_location_id}</span>
        </div>
      </div>
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="text-xs font-semibold uppercase text-zinc-500">Lines</div>
        <ul className="mt-2 space-y-2">
          {order.lines.map((ln) => (
            <li key={ln.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60">
              <span className="font-mono text-xs">{ln.sku_id}</span>
              <span>
                {ln.qty_allocated}/{ln.qty_requested} · {ln.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <Link href="/orders" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← Back to orders
        </Link>
      </div>
    </div>
  );
}
