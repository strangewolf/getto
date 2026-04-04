import type { Prisma } from "@prisma/client";
import { appendEvent } from "@/lib/server/events";

export async function planTrip(
  tx: Prisma.TransactionClient,
  orgId: string,
  warehouseLocationId: string,
  orderIds: string[],
  vehicleId: string | null,
  driverId: string | null,
  plannedStart: Date | null,
  actorUserId: string | null,
) {
  const orders = await tx.order.findMany({
    where: { id: { in: orderIds }, orgId },
    include: { lines: true },
  });
  if (orders.length !== orderIds.length) {
    throw new Error("One or more orders not found");
  }
  for (const o of orders) {
    if (o.status !== "ready_to_ship") {
      throw new Error(`Order ${o.id} must be ready_to_ship`);
    }
    if (o.warehouseLocationId !== warehouseLocationId) {
      throw new Error("Order warehouse mismatch");
    }
  }

  const byRetailer = new Map<string, typeof orders>();
  for (const o of orders) {
    const k = o.retailerLocationId;
    const arr = byRetailer.get(k) ?? [];
    arr.push(o);
    byRetailer.set(k, arr);
  }

  const trip = await tx.trip.create({
    data: {
      orgId,
      warehouseLocationId,
      status: "planned",
      vehicleId: vehicleId ?? undefined,
      driverId: driverId ?? undefined,
      plannedStart: plannedStart ?? undefined,
    },
  });

  const retailerIds = [...byRetailer.keys()].sort();
  let seq = 0;
  for (const retailerId of retailerIds) {
    const group = byRetailer.get(retailerId)!;
    seq += 1;
    const stop = await tx.tripStop.create({
      data: {
        tripId: trip.id,
        sequence: seq,
        locationId: retailerId,
        status: "pending",
      },
    });
    for (const order of group) {
      for (const line of order.lines) {
        if (line.qtyAllocated <= 0) continue;
        await tx.stopDelivery.create({
          data: {
            tripStopId: stop.id,
            orderLineId: line.id,
            qtyPlanned: line.qtyAllocated,
            status: "pending",
          },
        });
      }
    }
  }

  for (const o of orders) {
    await tx.order.update({
      where: { id: o.id },
      data: { status: "in_fulfillment" },
    });
  }

  await appendEvent(
    tx,
    "TripPlanned",
    { trip_id: trip.id, order_ids: orderIds },
    orgId,
    actorUserId,
  );

  return trip;
}
