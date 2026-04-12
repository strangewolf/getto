"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type TripStopRow = {
  id: string;
  sequence: number;
  location_id: string;
  location_name: string;
  status: string;
  eta: string | null;
  delivery_count: number;
  qty_planned_total: number;
};

type Trip = {
  id: string;
  status: string;
  warehouse_location_id: string;
  warehouse_location_name: string;
  vehicle_id: string | null;
  vehicle_reg: string | null;
  driver_id: string | null;
  driver_name: string | null;
  planned_start: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
  stops: TripStopRow[];
};

function formatCreated(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    planned: "Planned",
    in_transit: "In transit",
    dispatched: "Dispatched",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function statusPillClass(status: string) {
  if (status === "planned")
    return "bg-sky-200/90 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100";
  if (status === "completed")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (status === "in_transit" || status === "dispatched" || status === "active")
    return "bg-amber-200/90 text-amber-950 dark:bg-amber-950/80 dark:text-amber-100";
  if (status === "cancelled") return "bg-red-200/90 text-red-950 dark:bg-red-950/60 dark:text-red-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

function stopStatusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    arrived: "Arrived",
    completed: "Completed",
    skipped: "Skipped",
  };
  return map[s] ?? s.replace(/_/g, " ");
}

export default function TripsPage() {
  const [rows, setRows] = useState<Trip[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetch<Trip[]>("/trips");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trips</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Dispatch runs from the warehouse: planned, in progress, and completed trips from the mock API.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All trips</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Created time, warehouse, vehicle and driver, milestones, and per-stop delivery plan from the mock API.
        </p>
        <DataTable<Trip & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "created_at",
              header: "Created",
              cellClass: "min-w-[10.5rem] max-w-[13rem]",
              render: (r) => {
                const t = r as Trip;
                return (
                  <div className="space-y-0.5">
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">{formatCreated(t.created_at)}</div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{t.id}</div>
                  </div>
                );
              },
            },
            {
              key: "warehouse_location_name",
              header: "Warehouse & schedule",
              cellClass: "min-w-[14rem] max-w-[22rem]",
              render: (r) => {
                const t = r as Trip;
                const planned = formatWhen(t.planned_start);
                const dispatched = formatWhen(t.dispatched_at);
                const completed = formatWhen(t.completed_at);
                return (
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.warehouse_location_name}</div>
                    {planned ? (
                      <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">Planned start · {planned}</p>
                    ) : null}
                    {dispatched ? (
                      <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">Dispatched · {dispatched}</p>
                    ) : null}
                    {completed ? (
                      <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">Completed · {completed}</p>
                    ) : null}
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              cellClass: "whitespace-nowrap",
              render: (r) => {
                const t = r as Trip;
                return (
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusPillClass(t.status)}`}
                  >
                    {statusLabel(t.status)}
                  </span>
                );
              },
            },
            {
              key: "vehicle_driver",
              header: "Vehicle & driver",
              sortable: false,
              cellClass: "min-w-[12rem] max-w-[18rem]",
              render: (r) => {
                const t = r as Trip;
                return (
                  <div className="space-y-1 text-xs leading-snug">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Vehicle · </span>
                      {t.vehicle_reg ? (
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.vehicle_reg}</span>
                      ) : t.vehicle_id ? (
                        <span className="font-mono text-zinc-600 dark:text-zinc-300">{t.vehicle_id}</span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">Unassigned</span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Driver · </span>
                      {t.driver_name ? (
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.driver_name}</span>
                      ) : t.driver_id ? (
                        <span className="font-mono text-zinc-600 dark:text-zinc-300">{t.driver_id}</span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "stops_detail",
              header: "Stops & deliveries",
              sortable: false,
              cellClass: "min-w-[16rem] max-w-[28rem]",
              render: (r) => {
                const t = r as Trip;
                if (!t.stops.length) {
                  return <span className="text-xs text-zinc-500 dark:text-zinc-400">No stops</span>;
                }
                return (
                  <ul className="list-none space-y-1.5">
                    {t.stops.map((s) => {
                      const etaText = formatWhen(s.eta);
                      return (
                        <li key={s.id} className="text-xs leading-snug">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            #{s.sequence} · {s.location_name}
                          </span>
                          <div className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                            {stopStatusLabel(s.status)}
                            {etaText ? ` · ETA ${etaText}` : null}
                          </div>
                          <div className="mt-0.5 tabular-nums text-zinc-500 dark:text-zinc-400">
                            {s.delivery_count} drop{s.delivery_count === 1 ? "" : "s"} · {s.qty_planned_total} units planned
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              },
            },
            {
              key: "_actions",
              header: "Actions",
              sortable: false,
              cellClass: "min-w-[9rem] whitespace-normal",
              render: (r) => {
                const t = r as Trip;
                return (
                  <Link
                    href={`/trips/${t.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 sm:min-h-9 sm:py-1.5"
                  >
                    Open
                  </Link>
                );
              },
            },
          ]}
          rows={rows as (Trip & Record<string, unknown>)[]}
          pageSize={12}
        />
      </div>
    </div>
  );
}
