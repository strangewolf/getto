import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { appendEventDirect } from "@/lib/server/events";
import { loadTripFull } from "@/lib/server/delivery";
import { tripOut } from "@/lib/server/serializers";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tripId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { tripId } = await ctx.params;
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, orgId: user.orgId },
    });
    if (!trip) throw new HttpError(404, "Trip not found");
    if (!["planned", "draft"].includes(trip.status)) {
      throw new HttpError(400, "Trip cannot be dispatched in current status");
    }
    if (!trip.vehicleId || !trip.driverId) {
      throw new HttpError(400, "Assign vehicle and driver before dispatch");
    }
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "dispatched", dispatchedAt: new Date() },
    });
    await appendEventDirect(
      "TripDispatched",
      { trip_id: tripId },
      trip.orgId,
      user.id,
    );
    const full = await loadTripFull(tripId);
    if (!full) throw new HttpError(404, "Trip not found");
    return NextResponse.json(tripOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
