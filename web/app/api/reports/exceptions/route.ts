import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, Number(searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const totalStops = await prisma.tripStop.count({
      where: {
        arrivedAt: { gte: since, not: null },
        trip: { orgId: user.orgId },
      },
    });

    const bad = await prisma.stopDelivery.count({
      where: {
        status: { in: ["failed", "partial"] },
        podCapturedAt: { gte: since },
        tripStop: { trip: { orgId: user.orgId } },
      },
    });

    return NextResponse.json({
      failed_or_partial_stops: bad,
      total_stops: totalStops,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
