import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { orderOut } from "@/lib/server/serializers";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { orderId } = await ctx.params;
    const o = await prisma.order.findFirst({
      where: { id: orderId, orgId: user.orgId },
      include: { lines: true },
    });
    if (!o) throw new HttpError(404, "Order not found");
    return NextResponse.json(orderOut(o));
  } catch (e) {
    return handleRouteError(e);
  }
}
