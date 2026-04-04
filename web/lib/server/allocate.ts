import type { Prisma } from "@prisma/client";
import { appendEvent } from "@/lib/server/events";

export async function allocateOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorUserId: string | null,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order) throw new Error("Order not found");
  if (["shipped", "delivered", "cancelled"].includes(order.status)) {
    throw new Error("Order cannot be allocated in current status");
  }

  const warehouseId = order.warehouseLocationId;

  for (const line of order.lines) {
    const ln = await tx.orderLine.findUniqueOrThrow({ where: { id: line.id } });
    const need = ln.qtyRequested - ln.qtyAllocated;
    if (need <= 0) continue;

    const inv = await tx.inventoryBalance.findFirst({
      where: { locationId: warehouseId, skuId: ln.skuId },
    });
    if (!inv) continue;

    const available = inv.onHand - inv.reserved;
    const take = Math.min(need, Math.max(0, available));
    if (take <= 0) continue;

    await tx.inventoryBalance.update({
      where: { id: inv.id },
      data: { reserved: { increment: take } },
    });

    const newAllocated = ln.qtyAllocated + take;
    await tx.orderLine.update({
      where: { id: ln.id },
      data: {
        qtyAllocated: newAllocated,
        status: newAllocated > 0 ? "allocated" : ln.status,
      },
    });

    await tx.allocation.create({
      data: {
        orderLineId: ln.id,
        inventoryBalanceId: inv.id,
        qty: take,
      },
    });
  }

  const linesAfter = await tx.orderLine.findMany({ where: { orderId } });
  const stillPending = linesAfter.some((l) => l.qtyAllocated < l.qtyRequested);
  if (stillPending) {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "pending_allocation" },
    });
  } else {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "ready_to_ship" },
    });
    await appendEvent(
      tx,
      "OrderAllocated",
      { order_id: orderId },
      order.orgId,
      actorUserId,
    );
  }

  return tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { lines: true },
  });
}
