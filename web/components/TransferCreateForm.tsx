"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Loc = { id: string; name: string; type: string };
type Sku = { id: string; sku_code: string; name: string };

export function TransferCreateForm({ onCreated }: { onCreated: () => void | Promise<void> }) {
  const [warehouses, setWarehouses] = useState<Loc[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [qty, setQty] = useState(50);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [w, s] = await Promise.all([apiFetch<Loc[]>("/locations?type=warehouse"), apiFetch<Sku[]>("/skus")]);
      setWarehouses(w);
      setSkus(s);
      if (w[0]) setFromId(w[0].id);
      if (w.length > 1) setToId(w[1].id);
      else if (w[0]) setToId(w[0].id);
      if (s[0]) setSkuId(s[0].id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (!fromId || !toId) {
        setErr("Choose both warehouses.");
        return;
      }
      if (fromId === toId) {
        setErr("Source and destination must be different warehouses.");
        return;
      }
      await apiFetch("/transfers", {
        method: "POST",
        json: {
          from_location_id: fromId,
          to_location_id: toId,
          lines: [{ sku_id: skuId, qty }],
          notes: notes.trim() || null,
        },
      });
      await Promise.resolve(onCreated());
      setNotes("");
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
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New inter-warehouse transfer</div>
      {err ? <div className="text-sm text-red-600 dark:text-red-400">{err}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          From warehouse
          <select
            className="input-chamfer py-2.5 text-sm"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            {warehouses.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          To warehouse
          <select
            className="input-chamfer py-2.5 text-sm"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
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
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:col-span-2">
          Notes <span className="font-normal text-zinc-500">(optional)</span>
          <textarea
            rows={2}
            placeholder="Reason, handling instructions, or reference…"
            className="input-chamfer min-h-[4.5rem] resize-y py-2.5 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="chamfer-control w-full bg-primary-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 sm:max-w-xs"
      >
        {busy ? "Creating…" : "Create transfer"}
      </button>
    </form>
  );
}
