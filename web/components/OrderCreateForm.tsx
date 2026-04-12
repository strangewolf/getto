"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Loc = { id: string; name: string; type: string };
type Sku = { id: string; sku_code: string; name: string };

export function OrderCreateForm({ onCreated }: { onCreated: () => void | Promise<void> }) {
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
      await Promise.resolve(onCreated());
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card-chamfer space-y-4 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
    >
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New replenishment order</div>
      {err ? <div className="text-sm text-red-600 dark:text-red-400">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Retailer
          <select
            className="input-chamfer py-2.5 text-sm"
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Warehouse
          <select
            className="input-chamfer py-2.5 text-sm"
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          SKU
          <select
            className="input-chamfer py-2.5 text-sm"
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Quantity
          <input
            type="number"
            min={0.01}
            step={0.01}
            className="input-chamfer py-2.5 text-sm"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="chamfer-control w-full bg-primary-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 sm:max-w-xs"
      >
        {busy ? "Creating…" : "Create order"}
      </button>
    </form>
  );
}
