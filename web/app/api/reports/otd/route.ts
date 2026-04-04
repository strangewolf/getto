import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, Number(searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const total = await prisma.stopDelivery.count({
      where: {
        status: { in: ["delivered", "partial", "failed"] },
        AND: [{ podCapturedAt: { not: null } }, { podCapturedAt: { gte: since } }],
      },
    });
    const failed = await prisma.stopDelivery.count({
      where: {
        status: { in: ["failed", "partial"] },
        AND: [{ podCapturedAt: { not: null } }, { podCapturedAt: { gte: since } }],
      },
    });
    const ok = Math.max(0, total - failed);
    const rate = total ? ok / total : 1;
    return NextResponse.json({
      window_days: days,
      on_time_rate: rate,
      total_deliveries: total,
      late_or_failed: failed,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
