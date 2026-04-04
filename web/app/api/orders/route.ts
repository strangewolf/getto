import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { appendEvent } from "@/lib/server/events";
import { orderOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const orders = await prisma.order.findMany({
      where: {
        orgId: user.orgId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { lines: true },
    });
    return NextResponse.json(orders.map(orderOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type LineIn = { sku_id?: string; qty?: number };
type CreateBody = {
  retailer_location_id?: string;
  warehouse_location_id?: string;
  lines?: LineIn[];
  priority?: number;
  requested_window_start?: string | null;
  requested_window_end?: string | null;
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    if (!body.retailer_location_id || !body.warehouse_location_id || !body.lines?.length) {
      return NextResponse.json(
        { detail: "retailer_location_id, warehouse_location_id, and lines required" },
        { status: 400 },
      );
    }
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orgId: user.orgId,
          retailerLocationId: body.retailer_location_id!,
          warehouseLocationId: body.warehouse_location_id!,
          status: "pending_allocation",
          priority: body.priority ?? 0,
          requestedWindowStart: body.requested_window_start
            ? new Date(body.requested_window_start)
            : undefined,
          requestedWindowEnd: body.requested_window_end
            ? new Date(body.requested_window_end)
            : undefined,
          notes: body.notes ?? undefined,
          createdByUserId: user.id,
          lines: {
            create: body.lines!.map((ln) => ({
              skuId: ln.sku_id!,
              qtyRequested: ln.qty!,
              qtyAllocated: 0,
              status: "pending",
            })),
          },
        },
        include: { lines: true },
      });
      await appendEvent(
        tx,
        "OrderCreated",
        { order_id: o.id },
        user.orgId,
        user.id,
      );
      return o;
    });
    const full = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { lines: true },
    });
    return NextResponse.json(orderOut(full), { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
