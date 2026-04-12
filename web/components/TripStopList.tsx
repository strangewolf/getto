"use client";

import Link from "next/link";

export type Stop = {
  id: string;
  sequence: number;
  location_id: string;
  status: string;
  deliveries: { id: string; order_line_id: string; qty_planned: number; status: string }[];
};

export function TripStopList({ tripId, stops }: { tripId: string; stops: Stop[] }) {
  return (
    <div className="space-y-2">
      {stops.map((s) => (
        <div key={s.id} className="chamfer-card border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">
              Stop {s.sequence}{" "}
              <span className="font-mono text-xs text-zinc-500">{s.location_id.slice(0, 8)}…</span>
            </div>
            <span className="text-xs uppercase text-zinc-500">{s.status}</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {s.deliveries.map((d) => (
              <li key={d.id}>
                Line {d.order_line_id.slice(0, 8)}… · plan {d.qty_planned} · {d.status}
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <Link className="text-xs text-primary-700 hover:underline dark:text-primary-400" href={`/driver/trips/${tripId}?stop=${s.id}`}>
              Open driver POD
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
