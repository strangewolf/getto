import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleRouteError } from "@/lib/server/http";
import { tripSummary } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const rows = await prisma.trip.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows.map(tripSummary));
  } catch (e) {
    return handleRouteError(e);
  }
}
