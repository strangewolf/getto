import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, Number(searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const trips = await prisma.trip.findMany({
      where: { orgId: user.orgId, createdAt: { gte: since } },
    });
    if (trips.length === 0) {
      return NextResponse.json({
        avg_stops_per_trip: 0,
        trips_in_period: 0,
        completed_trips: 0,
      });
    }
    const completed = trips.filter((t) => t.status === "completed");
    const stopsCounts: number[] = [];
    for (const t of trips) {
      const n = await prisma.tripStop.count({ where: { tripId: t.id } });
      stopsCounts.push(n);
    }
    const avg = stopsCounts.reduce((a, b) => a + b, 0) / stopsCounts.length;
    return NextResponse.json({
      avg_stops_per_trip: avg,
      trips_in_period: trips.length,
      completed_trips: completed.length,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
