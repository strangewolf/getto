import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { appendEvent } from "@/lib/server/events";
import {
  applyStopDelivery,
  markTripCompletedIfAllStopsDone,
  refreshOrderStatus,
  loadTripFull,
} from "@/lib/server/delivery";
import { tripOut } from "@/lib/server/serializers";

type DelLine = {
  stop_delivery_id?: string;
  qty_delivered?: number;
  status?: string;
  reason_code?: string | null;
  signature_url?: string | null;
  photo_url?: string | null;
};

type Body = { deliveries?: DelLine[] };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tripId: string; stopId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { tripId, stopId } = await ctx.params;
    const body = await readJson<Body>(req);
    if (!body.deliveries?.length) {
      return NextResponse.json({ detail: "deliveries required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, orgId: user.orgId },
      });
      if (!trip) throw new HttpError(404, "Trip not found");
      const stop = await tx.tripStop.findFirst({
        where: { id: stopId, tripId },
      });
      if (!stop) throw new HttpError(404, "Stop not found");

      for (const line of body.deliveries!) {
        const item = await tx.stopDelivery.findFirst({
          where: { id: line.stop_delivery_id!, tripStopId: stopId },
        });
        if (!item) throw new HttpError(400, "Invalid stop delivery");
        await applyStopDelivery(
          tx,
          trip,
          stop,
          item,
          line.qty_delivered ?? 0,
          line.status ?? "delivered",
          line.reason_code ?? null,
          line.signature_url ?? null,
          line.photo_url ?? null,
        );
        const lineObj = await tx.orderLine.findUnique({
          where: { id: item.orderLineId },
        });
        if (lineObj) {
          await refreshOrderStatus(tx, lineObj.orderId);
        }
        await appendEvent(
          tx,
          "PODCaptured",
          { stop_delivery_id: item.id, qty: line.qty_delivered ?? 0 },
          trip.orgId,
          user.id,
        );
      }

      await tx.tripStop.update({
        where: { id: stopId },
        data: { status: "completed" },
      });
      await markTripCompletedIfAllStopsDone(tx, tripId);
    });

    const full = await loadTripFull(tripId);
    if (!full) throw new HttpError(404, "Trip not found");
    return NextResponse.json(tripOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
