"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { apiFetch } from "@/lib/api";

type Location = {
  id: string;
  org_id: string;
  type: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

function typeLabel(t: string) {
  if (t === "retailer") return "Retailer";
  if (t === "warehouse") return "Warehouse";
  return t.replace(/_/g, " ");
}

function typePillClass(t: string) {
  if (t === "warehouse")
    return "bg-primary-200/90 text-primary-950 dark:bg-primary-950/70 dark:text-primary-100";
  if (t === "retailer")
    return "bg-sky-200/90 text-sky-950 dark:bg-sky-950/80 dark:text-sky-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

function formatCoord(n: number | null) {
  if (n == null || Number.isNaN(n)) return null;
  return n.toFixed(5);
}

export default function LocationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Location[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetch<Location[]>("/locations");
    setRows(data);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Locations</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Warehouses and retail sites used for orders, trips, and inventory — open a row for map and full address.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">All locations</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Type, address, and coordinates from the mock API; click a row or use Open for the detail view.
        </p>
        <DataTable<Location & Record<string, unknown>>
          tableMinWidthClass="min-w-[56rem]"
          columns={[
            {
              key: "name",
              header: "Site",
              cellClass: "min-w-[12rem] max-w-[20rem]",
              render: (r) => {
                const loc = r as Location;
                return (
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{loc.name}</div>
                    <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{loc.id}</div>
                  </div>
                );
              },
            },
            {
              key: "type",
              header: "Type",
              cellClass: "whitespace-nowrap",
              render: (r) => {
                const loc = r as Location;
                return (
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${typePillClass(loc.type)}`}
                  >
                    {typeLabel(loc.type)}
                  </span>
                );
              },
            },
            {
              key: "address",
              header: "Address & coordinates",
              sortable: false,
              cellClass: "min-w-[16rem] max-w-[28rem]",
              render: (r) => {
                const loc = r as Location;
                const lat = formatCoord(loc.lat);
                const lng = formatCoord(loc.lng);
                return (
                  <div>
                    {loc.address ? (
                      <p className="line-clamp-2 text-sm leading-snug text-zinc-900 dark:text-zinc-100">{loc.address}</p>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No address on file</p>
                    )}
                    {lat && lng ? (
                      <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {lat}, {lng}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">No coordinates</p>
                    )}
                  </div>
                );
              },
            },
            {
              key: "_actions",
              header: "Actions",
              sortable: false,
              cellClass: "min-w-[9rem] whitespace-normal",
              render: (r) => {
                const loc = r as Location;
                return (
                  <Link
                    href={`/locations/${loc.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 sm:min-h-9 sm:py-1.5"
                  >
                    Open
                  </Link>
                );
              },
            },
          ]}
          rows={rows as (Location & Record<string, unknown>)[]}
          pageSize={12}
          onRowClick={(row) => router.push(`/locations/${(row as Location).id}`)}
        />
      </div>
    </div>
  );
}
