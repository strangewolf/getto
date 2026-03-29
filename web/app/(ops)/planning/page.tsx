"use client";

import { useRouter } from "next/navigation";
import { TripPlanner } from "@/components/TripPlanner";

export default function PlanningPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Planning</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cluster ready-to-ship orders into trips</p>
      </div>
      <TripPlanner onPlanned={(id) => router.push(`/trips/${id}`)} />
    </div>
  );
}
