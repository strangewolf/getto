import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { skuOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const rows = await prisma.sKU.findMany({ where: { isActive: true } });
    return NextResponse.json(rows.map(skuOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type CreateBody = {
  sku_code?: string;
  name?: string;
  uom?: string;
  weight_kg?: number | null;
  volume_m3?: number | null;
};

export async function POST(req: Request) {
  try {
    await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    const code = body.sku_code?.trim();
    if (!code || !body.name) {
      return NextResponse.json({ detail: "sku_code and name required" }, { status: 400 });
    }
    const sku = await prisma.sKU.create({
      data: {
        skuCode: code,
        name: body.name,
        uom: body.uom ?? "unit",
        weightKg: body.weight_kg ?? undefined,
        volumeM3: body.volume_m3 ?? undefined,
      },
    });
    return NextResponse.json(skuOut(sku));
  } catch (e) {
    return handleRouteError(e);
  }
}
