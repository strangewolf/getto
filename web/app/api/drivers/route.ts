import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, readJson, handleRouteError } from "@/lib/server/http";
import { driverOut } from "@/lib/server/serializers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const rows = await prisma.driver.findMany({ where: { orgId: user.orgId } });
    return NextResponse.json(rows.map(driverOut));
  } catch (e) {
    return handleRouteError(e);
  }
}

type CreateBody = {
  name?: string;
  phone?: string | null;
  user_id?: string | null;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await readJson<CreateBody>(req);
    if (!body.name) {
      return NextResponse.json({ detail: "name required" }, { status: 400 });
    }
    const d = await prisma.driver.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        phone: body.phone ?? undefined,
        userId: body.user_id ?? undefined,
      },
    });
    return NextResponse.json(driverOut(d));
  } catch (e) {
    return handleRouteError(e);
  }
}
