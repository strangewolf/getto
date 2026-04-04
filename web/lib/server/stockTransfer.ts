import type { Prisma } from "@prisma/client";
import { appendEvent } from "@/lib/server/events";

async function requireWarehouses(
  tx: Prisma.TransactionClient,
  orgId: string,
  fromId: string,
  toId: string,
) {
  if (fromId === toId) throw new Error("Source and destination must differ");
  const a = await tx.location.findUnique({ where: { id: fromId } });
  const b = await tx.location.findUnique({ where: { id: toId } });
  if (!a || !b || a.orgId !== orgId || b.orgId !== orgId) {
    throw new Error("Locations not found or org mismatch");
  }
  if (a.type !== "warehouse" || b.type !== "warehouse") {
    throw new Error("Both endpoints must be warehouse locations");
  }
  return { a, b };
}

export async function createTransfer(
  tx: Prisma.TransactionClient,
  orgId: string,
  fromLocationId: string,
  toLocationId: string,
  lines: { skuId: string; qty: number }[],
  notes: string | null,
  createdByUserId: string | null,
) {
  await requireWarehouses(tx, orgId, fromLocationId, toLocationId);
  const seen = new Set<string>();
  for (const { skuId, qty } of lines) {
    if (seen.has(skuId)) throw new Error("Duplicate SKU in transfer lines");
    seen.add(skuId);
    if (qty <= 0) throw new Error("Quantities must be positive");
    const sku = await tx.sKU.findUnique({ where: { id: skuId } });
    if (!sku) throw new Error(`SKU ${skuId} not found`);
  }

  const t = await tx.stockTransfer.create({
    data: {
      orgId,
      fromLocationId,
      toLocationId,
      status: "draft",
      notes: notes ?? undefined,
      createdByUserId: createdByUserId ?? undefined,
      lines: {
        create: lines.map((l) => ({
          skuId: l.skuId,
          qtyRequested: l.qty,
          qtyShipped: 0,
          qtyReceived: 0,
        })),
      },
    },
    include: { lines: true },
  });

  await appendEvent(
    tx,
    "TransferCreated",
    {
      transfer_id: t.id,
      from: fromLocationId,
      to: toLocationId,
    },
    orgId,
    createdByUserId,
  );
  return t;
}

export async function shipTransfer(
  tx: Prisma.TransactionClient,
  transferId: string,
  orgId: string,
  actorUserId: string | null,
) {
  const t = await tx.stockTransfer.findFirst({
    where: { id: transferId, orgId },
    include: { lines: true },
  });
  if (!t) throw new Error("Transfer not found");
  if (t.status !== "draft") throw new Error("Only draft transfers can be shipped");
  if (t.lines.length === 0) throw new Error("Transfer has no lines");

  for (const line of t.lines) {
    const inv = await tx.inventoryBalance.findFirst({
      where: { locationId: t.fromLocationId, skuId: line.skuId },
    });
    if (!inv) {
      throw new Error(`No inventory row for SKU at source warehouse (line ${line.id})`);
    }
    const available = inv.onHand - inv.reserved;
    const need = line.qtyRequested;
    if (available < need) {
      throw new Error(`Insufficient stock for SKU ${line.skuId}: need ${need}, available ${available}`);
    }
    await tx.inventoryBalance.update({
      where: { id: inv.id },
      data: { onHand: inv.onHand - need },
    });
    await tx.stockTransferLine.update({
      where: { id: line.id },
      data: { qtyShipped: need },
    });
  }

  await tx.stockTransfer.update({
    where: { id: transferId },
    data: { status: "in_transit" },
  });
  await appendEvent(tx, "TransferShipped", { transfer_id: t.id }, orgId, actorUserId);
  return tx.stockTransfer.findFirstOrThrow({
    where: { id: transferId },
    include: { lines: true },
  });
}

export async function receiveTransfer(
  tx: Prisma.TransactionClient,
  transferId: string,
  orgId: string,
  actorUserId: string | null,
) {
  const t = await tx.stockTransfer.findFirst({
    where: { id: transferId, orgId },
    include: { lines: true },
  });
  if (!t) throw new Error("Transfer not found");
  if (t.status !== "in_transit") throw new Error("Only in_transit transfers can be received");

  for (const line of t.lines) {
    const qty = line.qtyShipped;
    if (qty <= 0) continue;
    let inv = await tx.inventoryBalance.findFirst({
      where: { locationId: t.toLocationId, skuId: line.skuId },
    });
    if (!inv) {
      inv = await tx.inventoryBalance.create({
        data: {
          locationId: t.toLocationId,
          skuId: line.skuId,
          onHand: 0,
          reserved: 0,
        },
      });
    }
    await tx.inventoryBalance.update({
      where: { id: inv.id },
      data: { onHand: inv.onHand + qty },
    });
    await tx.stockTransferLine.update({
      where: { id: line.id },
      data: { qtyReceived: qty },
    });
  }

  await tx.stockTransfer.update({
    where: { id: transferId },
    data: { status: "received" },
  });
  await appendEvent(tx, "TransferReceived", { transfer_id: t.id }, orgId, actorUserId);
  return tx.stockTransfer.findFirstOrThrow({
    where: { id: transferId },
    include: { lines: true },
  });
}

export async function cancelTransfer(
  tx: Prisma.TransactionClient,
  transferId: string,
  orgId: string,
  actorUserId: string | null,
) {
  const t = await tx.stockTransfer.findFirst({
    where: { id: transferId, orgId },
  });
  if (!t) throw new Error("Transfer not found");
  if (t.status !== "draft") throw new Error("Only draft transfers can be cancelled");
  await tx.stockTransfer.update({
    where: { id: transferId },
    data: { status: "cancelled" },
  });
  await appendEvent(tx, "TransferCancelled", { transfer_id: t.id }, orgId, actorUserId);
  return tx.stockTransfer.findFirstOrThrow({
    where: { id: transferId },
    include: { lines: true },
  });
}
