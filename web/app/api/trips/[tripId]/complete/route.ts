import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { markTripCompletedIfAllStopsDone, loadTripFull } from "@/lib/server/delivery";
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
    await prisma.$transaction(async (tx) => {
      await markTripCompletedIfAllStopsDone(tx, tripId);
    });
    const full = await loadTripFull(tripId);
    if (!full) throw new HttpError(404, "Trip not found");
    return NextResponse.json(tripOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
