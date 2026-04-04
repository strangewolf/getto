import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { planTrip } from "@/lib/server/planning";
import { loadTripFull } from "@/lib/server/delivery";
import { tripOut } from "@/lib/server/serializers";

type Body = {
  warehouse_location_id?: string;
  order_ids?: string[];
  vehicle_id?: string | null;
  driver_id?: string | null;
  planned_start?: string | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<Body>(req);
    if (!body.warehouse_location_id || !body.order_ids?.length) {
      return NextResponse.json(
        { detail: "warehouse_location_id and order_ids required" },
        { status: 400 },
      );
    }
    const trip = await prisma.$transaction(async (tx) =>
      planTrip(
        tx,
        user.orgId,
        body.warehouse_location_id!,
        body.order_ids!,
        body.vehicle_id ?? null,
        body.driver_id ?? null,
        body.planned_start ? new Date(body.planned_start) : null,
        user.id,
      ),
    );
    const full = await loadTripFull(trip.id);
    if (!full) throw new Error("Trip missing after plan");
    return NextResponse.json(tripOut(full), { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
