"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const LocationMap = dynamic(
  () => import("@/components/LocationMap").then((m) => ({ default: m.LocationMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/50 text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  },
);

type LocationDetail = {
  id: string;
  type: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export default function LocationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [loc, setLoc] = useState<LocationDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<LocationDetail>(`/locations/${id}`);
        setLoc(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [id]);

  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{err}</p>
        <Link href="/locations" className="text-primary-400 hover:underline">
          ← Back to locations
        </Link>
      </div>
    );
  }

  if (!loc) {
    return <div className="text-zinc-400">Loading…</div>;
  }

  const hasCoords = loc.lat != null && loc.lng != null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/locations" className="text-sm text-primary-400 hover:underline">
          ← Locations
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-50">Store details</h1>
        <p className="text-sm text-zinc-400">Location profile and map</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</dt>
            <dd className="mt-1 text-lg text-zinc-100">{loc.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Type</dt>
            <dd className="mt-1 text-lg capitalize text-zinc-100">{loc.type}</dd>
          </div>
          {loc.address ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Address</dt>
              <dd className="mt-1 text-zinc-200">{loc.address}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Latitude</dt>
            <dd className="mt-1 font-mono text-zinc-200">{loc.lat ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Longitude</dt>
            <dd className="mt-1 font-mono text-zinc-200">{loc.lng ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {hasCoords ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Map</h2>
          <LocationMap lat={loc.lat!} lng={loc.lng!} name={loc.name} className="h-[320px]" />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No coordinates on file for this location.</p>
      )}
    </div>
  );
}
