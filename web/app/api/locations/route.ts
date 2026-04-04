import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { locationOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const rows = await prisma.location.findMany({
      where: {
        orgId: user.orgId,
        ...(type ? { type } : {}),
      },
    });
    return NextResponse.json(rows.map(locationOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type CreateBody = {
  type?: string;
  name?: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    if (!body.type || !body.name) {
      return NextResponse.json({ detail: "type and name required" }, { status: 400 });
    }
    const loc = await prisma.location.create({
      data: {
        orgId: user.orgId,
        type: body.type,
        name: body.name,
        address: body.address ?? undefined,
        lat: body.lat ?? undefined,
        lng: body.lng ?? undefined,
      },
    });
    return NextResponse.json(locationOut(loc));
  } catch (e) {
    return handleRouteError(e);
  }
}
