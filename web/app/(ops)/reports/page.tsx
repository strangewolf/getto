"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { KpiCards } from "@/components/KpiCards";
import BorderGlow from "@/components/react-bits/BorderGlow/BorderGlow";
import { apiFetch } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";

type Exc = { failed_or_partial_stops: number; total_stops: number };

type OrderLine = {
  sku_id: string;
  qty_requested: number;
  qty_allocated: number;
  status: string;
};

type OrderRow = {
  id: string;
  status: string;
  retailer_location_id: string;
  warehouse_location_id: string;
  created_at: string;
  lines: OrderLine[];
};

type TripRow = {
  id: string;
  status: string;
  warehouse_location_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  created_at: string;
};

type InvRow = {
  id: string;
  location_name: string;
  sku_code: string;
  on_hand: number;
  reserved: number;
  available: number;
};

type SkuRow = {
  id: string;
  sku_code: string;
  name: string;
  uom: string;
  weight_kg: number | null;
  volume_m3: number | null;
};

const glowCard = {
  borderRadius: 18 as const,
  glowRadius: 26 as const,
  backgroundColor: "#0a0514",
  colors: ["#8400ff", "#c084fc", "#22d3ee"] as [string, string, string],
};

function ChartCard({
  label,
  data,
  emptyMessage,
}: {
  label: string;
  data: { label: string; value: number }[];
  emptyMessage: string;
}) {
  const max = data.length ? Math.max(...data.map((d) => d.value), 1) : 1;
  const barMaxPx = 112;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <BorderGlow {...glowCard} className="p-0">
        <div className="relative z-[1] flex flex-col overflow-hidden p-4">
          <div className="bits-type-body shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </div>
          {data.length === 0 ? (
            <p className="bits-type-body mt-4 text-sm text-zinc-500">{emptyMessage}</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex h-[7.5rem] shrink-0 items-end justify-between gap-2 sm:h-32">
                {data.map((d) => {
                  const h = Math.max(6, Math.round((d.value / max) * barMaxPx));
                  return (
                    <div key={`bar-${d.label}`} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary-800/90 to-primary-500/90 shadow-sm shadow-primary-950/40"
                        style={{ height: h }}
                        title={`${d.label}: ${d.value}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex shrink-0 justify-between gap-2">
                {data.map((d) => (
                  <div key={`cap-${d.label}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="w-full truncate text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {d.label.replace(/_/g, " ")}
                    </span>
                    <span className="bits-type-display text-sm tabular-nums text-zinc-200">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BorderGlow>
    </motion.div>
  );
}

function ExportCard({
  label,
  rowCount,
  onExport,
}: {
  label: string;
  rowCount: number;
  onExport: () => void;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <BorderGlow {...glowCard} className="p-0">
        <div className="relative z-[1] flex flex-col overflow-auto p-4">
          <div className="bits-type-body text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
          <BorderGlow
            borderRadius={12}
            glowRadius={18}
            backgroundColor="#12081f"
            colors={["#8400ff", "#c084fc", "#22d3ee"]}
            className="mt-3 p-0"
          >
            <motion.button
              type="button"
              onClick={onExport}
              className="bits-type-body w-full px-3 py-2.5 text-sm font-semibold text-zinc-100"
              whileTap={{ scale: 0.98 }}
            >
              Download CSV · {rowCount} rows
            </motion.button>
          </BorderGlow>
        </div>
      </BorderGlow>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [exc, setExc] = useState<Exc | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const [e, o, t, i, s] = await Promise.all([
        apiFetch<Exc>("/reports/exceptions?days=30"),
        apiFetch<OrderRow[]>("/orders"),
        apiFetch<TripRow[]>("/trips"),
        apiFetch<InvRow[]>("/inventory"),
        apiFetch<SkuRow[]>("/skus"),
      ]);
      setExc(e);
      setOrders(o);
      setTrips(t);
      setInventory(i);
      setSkus(s);
    } catch (err) {
      setLoadErr(err instanceof Error ? err.message : "Failed to load report data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tripStatusBars = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tr of trips) {
      counts[tr.status] = (counts[tr.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [trips]);

  const orderStatusBars = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [orders]);

  const orderLineCount = useMemo(
    () => orders.reduce((n, o) => n + Math.max(1, o.lines.length), 0),
    [orders],
  );

  const exportOrders = () => {
    const headers = [
      "order_id",
      "status",
      "retailer_location_id",
      "warehouse_location_id",
      "created_at",
      "line_sku_id",
      "qty_requested",
      "qty_allocated",
      "line_status",
    ];
    const rows: unknown[][] = [];
    for (const o of orders) {
      if (!o.lines.length) {
        rows.push([o.id, o.status, o.retailer_location_id, o.warehouse_location_id, o.created_at, "", "", "", ""]);
        continue;
      }
      for (const ln of o.lines) {
        rows.push([
          o.id,
          o.status,
          o.retailer_location_id,
          o.warehouse_location_id,
          o.created_at,
          ln.sku_id,
          ln.qty_requested,
          ln.qty_allocated,
          ln.status,
        ]);
      }
    }
    downloadCsv("orders-report.csv", headers, rows);
  };

  const exportTrips = () => {
    downloadCsv(
      "trips-report.csv",
      ["trip_id", "status", "warehouse_location_id", "vehicle_id", "driver_id", "created_at"],
      trips.map((t) => [t.id, t.status, t.warehouse_location_id, t.vehicle_id ?? "", t.driver_id ?? "", t.created_at]),
    );
  };

  const exportInventory = () => {
    downloadCsv(
      "inventory-report.csv",
      ["row_id", "location_name", "sku_code", "on_hand", "reserved", "available"],
      inventory.map((r) => [r.id, r.location_name, r.sku_code, r.on_hand, r.reserved, r.available]),
    );
  };

  const exportSkus = () => {
    downloadCsv(
      "skus-report.csv",
      ["sku_id", "sku_code", "name", "uom", "weight_kg", "volume_m3"],
      skus.map((r) => [r.id, r.sku_code, r.name, r.uom, r.weight_kg ?? "", r.volume_m3 ?? ""]),
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Reports</h1>
        <p className="text-sm text-zinc-400">Exceptions, distribution charts, and CSV exports from mock data.</p>
      </div>

      {loadErr ? (
        <p className="text-sm text-red-400" role="alert">
          {loadErr}
        </p>
      ) : null}

      <KpiCards
        items={[
          {
            label: "Exception stops",
            value: exc?.failed_or_partial_stops ?? "—",
            hint: exc ? `of ${exc.total_stops} stops` : undefined,
          },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Distribution</h2>
        <motion.div
          className="grid gap-3 sm:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <ChartCard label="Trips by status" data={tripStatusBars} emptyMessage="No trips to chart." />
          <ChartCard label="Orders by status" data={orderStatusBars} emptyMessage="No orders to chart." />
        </motion.div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Export CSV</h2>
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <ExportCard label="Orders" rowCount={orderLineCount} onExport={exportOrders} />
          <ExportCard label="Trips" rowCount={trips.length} onExport={exportTrips} />
          <ExportCard label="Inventory" rowCount={inventory.length} onExport={exportInventory} />
          <ExportCard label="SKUs" rowCount={skus.length} onExport={exportSkus} />
        </motion.div>
      </section>
    </div>
  );
}
