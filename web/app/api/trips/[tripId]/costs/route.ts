import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { appendEventDirect } from "@/lib/server/events";

type Body = {
  category?: string;
  amount?: number;
  currency?: string;
  notes?: string | null;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tripId: string }> },
) {
  try {
    const user = await requireAuth(req);
    const { tripId } = await ctx.params;
    const body = await readJson<Body>(req);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, orgId: user.orgId },
    });
    if (!trip) throw new HttpError(404, "Trip not found");
    if (!body.category || body.amount === undefined) {
      return NextResponse.json({ detail: "category and amount required" }, { status: 400 });
    }
    const existing = await prisma.tripCost.findFirst({
      where: { tripId, category: body.category },
    });
    if (existing) {
      throw new HttpError(400, "Cost for this category already posted for trip");
    }
    const tc = await prisma.tripCost.create({
      data: {
        tripId,
        category: body.category,
        amount: body.amount,
        currency: body.currency ?? "INR",
        notes: body.notes ?? undefined,
      },
    });
    await appendEventDirect(
      "CostPosted",
      { trip_id: tripId, category: body.category, amount: body.amount },
      trip.orgId,
      user.id,
    );
    return NextResponse.json({
      id: tc.id,
      trip_id: tripId,
      amount: body.amount,
      category: body.category,
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
