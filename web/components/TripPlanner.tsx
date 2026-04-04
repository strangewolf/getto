"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Order = { id: string; status: string; warehouse_location_id: string };
type Vehicle = { id: string; reg_number: string };
type Driver = { id: string; name: string };

export function TripPlanner({ onPlanned }: { onPlanned: (tripId: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [warehouseId, setWarehouseId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [o, v, d] = await Promise.all([
        apiFetch<Order[]>("/orders?status=ready_to_ship"),
        apiFetch<Vehicle[]>("/vehicles"),
        apiFetch<Driver[]>("/drivers"),
      ]);
      setOrders(o);
      setVehicles(v);
      setDrivers(d);
      const sel: Record<string, boolean> = {};
      o.slice(0, 5).forEach((x) => (sel[x.id] = true));
      setSelected(sel);
      if (o[0]) {
        setWarehouseId(o[0].warehouse_location_id);
      }
      if (v[0]) setVehicleId(v[0].id);
      if (d[0]) setDriverId(d[0].id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!warehouseId || ids.length === 0) {
      setErr("Select warehouse and at least one order");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const trip = await apiFetch<{ id: string }>("/trips/plan", {
        method: "POST",
        json: {
          warehouse_location_id: warehouseId,
          order_ids: ids,
          vehicle_id: vehicleId || null,
          driver_id: driverId || null,
        },
      });
      onPlanned(trip.id);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Plan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm font-semibold">Plan trip from ready-to-ship orders</div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Warehouse (must match orders)
        <input
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        />
      </label>
      <div>
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Orders</div>
        <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded border border-zinc-200 p-2 dark:border-zinc-800">
          {orders.length === 0 ? <div className="text-sm text-zinc-500">No ready_to_ship orders</div> : null}
          {orders.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!selected[o.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [o.id]: e.target.checked }))}
              />
              <span className="font-mono text-xs">{o.id}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Vehicle
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg_number}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Driver
          <select
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-2"
      >
        {busy ? "Planning…" : "Build trip"}
      </button>
    </form>
  );
}
