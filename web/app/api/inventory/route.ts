import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { inventoryRow } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("location_id");
    const rows = await prisma.inventoryBalance.findMany({
      where: {
        location: { orgId: user.orgId },
        ...(locationId ? { locationId } : {}),
      },
      include: { location: true, sku: true },
    });
    return NextResponse.json(rows.map(inventoryRow));
  } catch (e) {
    return handleRouteError(e);
  }
}
