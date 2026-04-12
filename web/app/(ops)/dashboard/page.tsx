"use client";

import { useEffect, useMemo, useState } from "react";
import MagicBento, { type BentoCardProps } from "@/components/react-bits/MagicBento";
import { apiFetch } from "@/lib/api";

type Otd = {
  on_time_rate: number;
  total_deliveries: number;
  late_or_failed: number;
};
type Util = {
  avg_stops_per_trip: number;
  trips_in_period: number;
  completed_trips: number;
};

type DriverInsights = {
  latest_onboarded: {
    driver_id: string;
    name: string;
    phone: string | null;
    onboarded_at: string;
  } | null;
  top_performer: {
    driver_id: string;
    name: string;
    completed_trips: number;
    units_delivered: number;
  } | null;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [otd, setOtd] = useState<Otd | null>(null);
  const [util, setUtil] = useState<Util | null>(null);
  const [drivers, setDrivers] = useState<DriverInsights | null>(null);

  useEffect(() => {
    void (async () => {
      const [a, b, c] = await Promise.all([
        apiFetch<Otd>("/reports/otd?days=30"),
        apiFetch<Util>("/reports/utilization?days=30"),
        apiFetch<DriverInsights>("/reports/drivers"),
      ]);
      setOtd(a);
      setUtil(b);
      setDrivers(c);
    })();
  }, []);

  const items = useMemo((): BentoCardProps[] => {
    const base: BentoCardProps = { color: "#060010" };
    const latest = drivers?.latest_onboarded;
    const top = drivers?.top_performer;

    return [
      {
        ...base,
        label: "Delivery",
        title: "On-time rate",
        description: otd ? `${(otd.on_time_rate * 100).toFixed(1)}% (30d)` : "Loading…",
      },
      {
        ...base,
        label: "Trips",
        title: "Trips in period",
        description: util != null ? String(util.trips_in_period) : "Loading…",
      },
      {
        ...base,
        label: "Density",
        title: "Avg stops / trip",
        description: util != null ? util.avg_stops_per_trip.toFixed(2) : "Loading…",
      },
      {
        ...base,
        label: "Exceptions",
        title: "Late or failed",
        description: otd != null ? String(otd.late_or_failed) : "Loading…",
      },
      {
        ...base,
        label: "Onboarding",
        title: "Latest onboarded",
        description: latest
          ? `${latest.name} · since ${fmtDate(latest.onboarded_at)}`
          : drivers
            ? "—"
            : "Loading…",
      },
      {
        ...base,
        label: "Performance",
        title: "Top performer",
        description: top
          ? `${top.name} · ${top.completed_trips} completed trip(s), ${top.units_delivered} units delivered`
          : drivers
            ? "No completed trips yet to rank."
            : "Loading…",
      },
    ];
  }, [otd, util, drivers]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="bits-type-display text-balance text-3xl tracking-tight text-zinc-50">Dashboard</h1>
        <p className="bits-type-body text-sm text-zinc-400">
          Magic Bento grid (React Bits) — KPI tiles with spotlight, particles, and border glow.
        </p>
      </header>

      <div className="-mx-3 flex justify-center sm:-mx-4 md:-mx-6">
        <MagicBento
          items={items}
          gridClassName="max-w-none w-full px-0"
          glowColor="132, 0, 255"
          enableSpotlight
          enableStars
          enableBorderGlow
          enableTilt={false}
          enableMagnetism
          clickEffect
        />
      </div>
    </div>
  );
}
