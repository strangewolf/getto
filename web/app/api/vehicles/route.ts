import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { vehicleOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const rows = await prisma.vehicle.findMany({ where: { orgId: user.orgId } });
    return NextResponse.json(rows.map(vehicleOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type CreateBody = {
  reg_number?: string;
  capacity_kg?: number | null;
  capacity_m3?: number | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    const reg = body.reg_number?.trim();
    if (!reg) {
      return NextResponse.json({ detail: "reg_number required" }, { status: 400 });
    }
    const v = await prisma.vehicle.create({
      data: {
        orgId: user.orgId,
        regNumber: reg,
        capacityKg: body.capacity_kg ?? undefined,
        capacityM3: body.capacity_m3 ?? undefined,
      },
    });
    return NextResponse.json(vehicleOut(v));
  } catch (e) {
    return handleRouteError(e);
  }
}
