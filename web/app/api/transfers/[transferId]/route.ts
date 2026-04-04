import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { transferOut } from "@/lib/server/serializers";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ transferId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { transferId } = await ctx.params;
    const t = await prisma.stockTransfer.findFirst({
      where: { id: transferId, orgId: user.orgId },
      include: { lines: true },
    });
    if (!t) throw new HttpError(404, "Transfer not found");
    return NextResponse.json(transferOut(t));
  } catch (e) {
    return handleRouteError(e);
  }
}
