import type { Prisma, Trip, TripStop, StopDelivery } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function applyStopDelivery(
  tx: Prisma.TransactionClient,
  trip: Trip,
  _stop: TripStop,
  item: StopDelivery,
  qtyDelivered: number,
  status: string,
  reasonCode: string | null,
  signatureUrl: string | null,
  photoUrl: string | null,
) {
  const warehouseId = trip.warehouseLocationId;
  const line = await tx.orderLine.findUnique({ where: { id: item.orderLineId } });
  if (!line) throw new Error("Order line missing");

  const inv = await tx.inventoryBalance.findFirst({
    where: { locationId: warehouseId, skuId: line.skuId },
  });
  if (!inv) throw new Error("Inventory row missing");

  const qty = Math.min(qtyDelivered, item.qtyPlanned);
  const reduceReserved = Math.min(qty, inv.reserved);

  await tx.inventoryBalance.update({
    where: { id: inv.id },
    data: {
      reserved: inv.reserved - reduceReserved,
      onHand: inv.onHand - qty,
    },
  });

  await tx.stopDelivery.update({
    where: { id: item.id },
    data: {
      qtyDelivered: qty,
      status,
      reasonCode: reasonCode ?? undefined,
      signatureUrl: signatureUrl ?? undefined,
      photoUrl: photoUrl ?? undefined,
      podCapturedAt: new Date(),
    },
  });

  if (status === "delivered" && qty >= item.qtyPlanned) {
    await tx.orderLine.update({ where: { id: line.id }, data: { status: "delivered" } });
  } else if (status === "partial") {
    await tx.orderLine.update({ where: { id: line.id }, data: { status: "shipped" } });
  }
}

export async function refreshOrderStatus(tx: Prisma.TransactionClient, orderId: string) {
  const lines = await tx.orderLine.findMany({ where: { orderId } });
  if (lines.length === 0) return;
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (lines.every((ln) => ln.status === "delivered")) {
    await tx.order.update({ where: { id: orderId }, data: { status: "delivered" } });
  } else if (lines.some((ln) => ln.status === "delivered")) {
    await tx.order.update({ where: { id: orderId }, data: { status: "shipped" } });
  }
}

export async function markTripCompletedIfAllStopsDone(
  tx: Prisma.TransactionClient,
  tripId: string,
) {
  const stops = await tx.tripStop.findMany({ where: { tripId } });
  for (const stop of stops) {
    const deliveries = await tx.stopDelivery.findMany({ where: { tripStopId: stop.id } });
    for (const d of deliveries) {
      if (d.status === "pending") return;
    }
  }
  await tx.trip.update({
    where: { id: tripId },
    data: { status: "completed", completedAt: new Date() },
  });
}

/** Load trip with stops and deliveries (sorted stops) */
export async function loadTripFull(tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId },
    include: {
      stops: {
        include: { deliveries: true },
        orderBy: { sequence: "asc" },
      },
    },
  });
  return trip;
}
