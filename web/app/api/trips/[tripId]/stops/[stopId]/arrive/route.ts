import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { appendEventDirect } from "@/lib/server/events";
import { loadTripFull } from "@/lib/server/delivery";
import { tripOut } from "@/lib/server/serializers";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tripId: string; stopId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { tripId, stopId } = await ctx.params;
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, orgId: user.orgId },
    });
    if (!trip) throw new HttpError(404, "Trip not found");
    const stop = await prisma.tripStop.findFirst({
      where: { id: stopId, tripId },
    });
    if (!stop) throw new HttpError(404, "Stop not found");
    await prisma.tripStop.update({
      where: { id: stopId },
      data: { status: "arrived", arrivedAt: new Date() },
    });
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "enroute" },
    });
    await appendEventDirect(
      "StopArrived",
      { trip_id: tripId, stop_id: stopId },
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
