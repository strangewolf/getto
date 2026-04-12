"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Del = {
  id: string;
  order_line_id: string;
  qty_planned: number;
  qty_delivered: number;
  status: string;
};

export function PODCapture({
  tripId,
  stopId,
  deliveries,
  onDone,
}: {
  tripId: string;
  stopId: string;
  deliveries: Del[];
  onDone: () => void;
}) {
  const [qtyMap, setQtyMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    deliveries.forEach((d) => {
      m[d.id] = d.qty_planned;
    });
    return m;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/trips/${tripId}/stops/${stopId}/deliver`, {
        method: "POST",
        json: {
          deliveries: deliveries.map((d) => ({
            stop_delivery_id: d.id,
            qty_delivered: qtyMap[d.id] ?? 0,
            status: (qtyMap[d.id] ?? 0) >= d.qty_planned ? "delivered" : "partial",
            reason_code: null,
            signature_url: null,
            photo_url: null,
          })),
        },
      });
      onDone();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-chamfer space-y-3 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm font-semibold">Proof of delivery</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      {deliveries.map((d) => (
        <label key={d.id} className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Delivery {d.id.slice(0, 8)}… (plan {d.qty_planned})
          <input
            type="number"
            min={0}
            step={0.01}
            className="input-chamfer mt-1 py-2 text-sm"
            value={qtyMap[d.id] ?? 0}
            onChange={(e) => setQtyMap((m) => ({ ...m, [d.id]: Number(e.target.value) }))}
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={busy}
        className="chamfer-control min-h-12 w-full bg-primary-700 px-3 py-3 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 sm:min-h-0 sm:py-2"
      >
        {busy ? "Saving…" : "Submit POD"}
      </button>
    </form>
  );
}
