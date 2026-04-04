import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { cancelTransfer } from "@/lib/server/stockTransfer";
import { transferOut } from "@/lib/server/serializers";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ transferId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { transferId } = await ctx.params;
    await prisma.$transaction(async (tx) => {
      await cancelTransfer(tx, transferId, user.orgId, user.id);
    });
    const full = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transferId },
      include: { lines: true },
    });
    return NextResponse.json(transferOut(full));
  } catch (e) {
    return handleRouteError(e);
  }
}
