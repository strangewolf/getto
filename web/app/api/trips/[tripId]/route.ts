import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { loadTripFull } from "@/lib/server/delivery";
import { tripOut } from "@/lib/server/serializers";

export async function GET(
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
    const full = await loadTripFull(tripId);
    if (!full) throw new HttpError(404, "Trip not found");
    return NextResponse.json(tripOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}

type PatchBody = {
  vehicle_id?: string | null;
  driver_id?: string | null;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ tripId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { tripId } = await ctx.params;
    const body = await readJson<PatchBody>(req);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, orgId: user.orgId },
    });
    if (!trip) throw new HttpError(404, "Trip not found");
    if (!["draft", "planned"].includes(trip.status)) {
      throw new HttpError(400, "Cannot reassign vehicle/driver in current status");
    }
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(body.vehicle_id !== undefined ? { vehicleId: body.vehicle_id } : {}),
        ...(body.driver_id !== undefined ? { driverId: body.driver_id } : {}),
      },
    });
    const full = await loadTripFull(tripId);
    if (!full) throw new HttpError(404, "Trip not found");
    return NextResponse.json(tripOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
