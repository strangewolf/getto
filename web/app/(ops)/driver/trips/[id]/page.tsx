"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PODCapture } from "@/components/PODCapture";
import { apiFetch } from "@/lib/api";

type Trip = {
  id: string;
  status: string;
  stops: {
    id: string;
    sequence: number;
    status: string;
    deliveries: {
      id: string;
      order_line_id: string;
      qty_planned: number;
      qty_delivered: number;
      status: string;
    }[];
  }[];
};

export default function DriverTripPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = String(params.id);
  const stopFromQuery = search.get("stop");
  const [trip, setTrip] = useState<Trip | null>(null);

  async function reload() {
    const t = await apiFetch<Trip>(`/trips/${id}`);
    setTrip(t);
  }

  useEffect(() => {
    void reload();
  }, [id]);

  const stop = useMemo(() => {
    if (!trip?.stops?.length) return null;
    if (stopFromQuery)
      return trip.stops.find((s) => s.id === stopFromQuery) ?? trip.stops[0];
    return trip.stops[0];
  }, [trip, stopFromQuery]);

  if (!trip) return <div className="p-4">Loading…</div>;
  if (!stop) return <div className="p-4">No stops</div>;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-bold">
        Driver · Trip {trip.id.slice(0, 8)}…
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Stop {stop.sequence}
      </p>
      <PODCapture
        tripId={trip.id}
        stopId={stop.id}
        deliveries={stop.deliveries}
        onDone={reload}
      />
    </div>
  );
}
