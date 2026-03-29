"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Loc = { id: string; name: string; type: string };
type Sku = { id: string; sku_code: string; name: string };

export function OrderCreateForm({ onCreated }: { onCreated: () => void }) {
  const [retailers, setRetailers] = useState<Loc[]>([]);
  const [warehouses, setWarehouses] = useState<Loc[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [retailerId, setRetailerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [qty, setQty] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [r, w, s] = await Promise.all([
        apiFetch<Loc[]>("/locations?type=retailer"),
        apiFetch<Loc[]>("/locations?type=warehouse"),
        apiFetch<Sku[]>("/skus"),
      ]);
      setRetailers(r);
      setWarehouses(w);
      setSkus(s);
      if (r[0]) setRetailerId(r[0].id);
      if (w[0]) setWarehouseId(w[0].id);
      if (s[0]) setSkuId(s[0].id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await apiFetch("/orders", {
        method: "POST",
        json: {
          retailer_location_id: retailerId,
          warehouse_location_id: warehouseId,
          lines: [{ sku_id: skuId, qty }],
          priority: 0,
        },
      });
      onCreated();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm font-semibold">New replenishment order</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Retailer
        <select
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={retailerId}
          onChange={(e) => setRetailerId(e.target.value)}
        >
          {retailers.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Warehouse
        <select
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          {warehouses.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        SKU
        <select
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={skuId}
          onChange={(e) => setSkuId(e.target.value)}
        >
          {skus.map((x) => (
            <option key={x.id} value={x.id}>
              {x.sku_code} — {x.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Quantity
        <input
          type="number"
          min={0.01}
          step={0.01}
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Create order"}
      </button>
    </form>
  );
}
