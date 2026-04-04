import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { allocateOrder } from "@/lib/server/allocate";
import { orderOut } from "@/lib/server/serializers";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { orderId } = await ctx.params;
    const existing = await prisma.order.findFirst({
      where: { id: orderId, orgId: user.orgId },
    });
    if (!existing) throw new HttpError(404, "Order not found");

    await prisma.$transaction(async (tx) => {
      await allocateOrder(tx, orderId, user.id);
    });

    const full = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { lines: true },
    });
    return NextResponse.json(orderOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
