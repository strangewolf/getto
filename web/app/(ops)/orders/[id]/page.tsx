"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderDetails, type OrderDetail } from "@/components/OrderDetails";
import { apiFetch } from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const o = await apiFetch<OrderDetail>(`/orders/${id}`);
        setOrder(o);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [id]);

  async function allocate() {
    try {
      const o = await apiFetch<OrderDetail>(`/orders/${id}/allocate`, { method: "POST" });
      setOrder(o);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Allocate failed");
    }
  }

  if (err) return <div className="text-red-600">{err}</div>;
  if (!order) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Order detail</h1>
        <button type="button" onClick={() => void allocate()} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
          Allocate inventory
        </button>
      </div>
      <OrderDetails order={order} />
    </div>
  );
}
