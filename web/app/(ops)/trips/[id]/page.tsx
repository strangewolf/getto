"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TripStopList, type Stop } from "@/components/TripStopList";
import { apiFetch } from "@/lib/api";

type Trip = {
  id: string;
  status: string;
  warehouse_location_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  stops: Stop[];
};

export default function TripDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    const t = await apiFetch<Trip>(`/trips/${id}`);
    setTrip(t);
  }

  useEffect(() => {
    void (async () => {
      try {
        await reload();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [id]);

  async function dispatch() {
    try {
      await apiFetch(`/trips/${id}/dispatch`, { method: "POST" });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Dispatch failed");
    }
  }

  if (err) return <div className="text-red-600">{err}</div>;
  if (!trip) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trip</h1>
          <p className="font-mono text-xs text-zinc-500">{trip.id}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase dark:bg-zinc-900">{trip.status}</span>
      </div>
      {trip.status === "planned" ? (
        <button type="button" onClick={() => void dispatch()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Dispatch
        </button>
      ) : null}
      <TripStopList tripId={trip.id} stops={trip.stops} />
    </div>
  );
}
