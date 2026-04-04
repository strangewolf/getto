import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { createTransfer } from "@/lib/server/stockTransfer";
import { transferOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const rows = await prisma.stockTransfer.findMany({
      where: {
        orgId: user.orgId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { lines: true },
    });
    return NextResponse.json(rows.map(transferOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type LineIn = { sku_id?: string; qty?: number };
type CreateBody = {
  from_location_id?: string;
  to_location_id?: string;
  lines?: LineIn[];
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    if (!body.from_location_id || !body.to_location_id || !body.lines?.length) {
      return NextResponse.json(
        { detail: "from_location_id, to_location_id, and lines required" },
        { status: 400 },
      );
    }
    const lines = body.lines.map((l) => ({
      skuId: l.sku_id!,
      qty: l.qty!,
    }));
    const t = await prisma.$transaction(async (tx) =>
      createTransfer(
        tx,
        user.orgId,
        body.from_location_id!,
        body.to_location_id!,
        lines,
        body.notes ?? null,
        user.id,
      ),
    );
    const full = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: t.id },
      include: { lines: true },
    });
    return NextResponse.json(transferOut(full), { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
